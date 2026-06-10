// src/pages/ClientRequest.jsx
// Pantalla para solicitar envío con geocodificación automática

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createShipment } from '../services/shipmentService';
import { useGeolocation } from '../hooks/useGeolocation';
import { geocodeShipmentAddresses, geocodeAddress } from '../services/geocodingService';
export const ClientRequest = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { location: userLocation } = useGeolocation();
  
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [cargoType, setCargoType] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estado para saber si usó ubicación actual
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validaciones
    if (!pickupAddress && !usingCurrentLocation) {
      setError('Ingresa la dirección de recogida o usa tu ubicación actual');
      return;
    }
    if (!deliveryAddress) {
      setError('Ingresa la dirección de entrega');
      return;
    }
    if (!cargoType) {
      setError('Selecciona el tipo de carga');
      return;
    }
    if (!cargoWeight || cargoWeight <= 0) {
      setError('Ingresa un peso válido');
      return;
    }
    
    setLoading(true);
    
    let pickupCoords = null;
    let finalPickupAddress = pickupAddress;
    
    // CASO 1: Usar ubicación actual del GPS
    if (usingCurrentLocation && userLocation) {
      pickupCoords = { lat: userLocation.lat, lng: userLocation.lng };
      finalPickupAddress = `Mi ubicación actual (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`;
    } 
    // CASO 2: Geocodificar dirección escrita
    else if (pickupAddress) {
      const geocodeResult = await geocodeShipmentAddresses(pickupAddress, deliveryAddress);
      
      if (!geocodeResult.pickupCoords) {
        setError('No se pudo encontrar la dirección de recogida. Sé más específico (ej: Calle 123, Pasto)');
        setLoading(false);
        return;
      }
      
      if (!geocodeResult.deliveryCoords) {
        setError('No se pudo encontrar la dirección de entrega. Sé más específico (ej: Carrera 45, Pasto)');
        setLoading(false);
        return;
      }
      
      pickupCoords = geocodeResult.pickupCoords;
      const deliveryCoords = geocodeResult.deliveryCoords;
      
      // Crear envío con ambas coordenadas
      const result = await createShipment({
        clientId: userData?.email,
        clientName: userData?.nombre,
        clientPhone: userData?.telefono,
        pickupAddress: finalPickupAddress,
        deliveryAddress: deliveryAddress,
        pickupCoords: pickupCoords,
        deliveryCoords: deliveryCoords,
        cargoType: cargoType,
        cargoWeight: parseFloat(cargoWeight),
        status: 'pending'
      });
      
      if (result.success) {
        alert('✅ Solicitud enviada. Espera a que un conductor acepte.');
        navigate('/');
      } else {
        setError(result.error);
      }
      
      setLoading(false);
      return;
    }
    
    // Si llegamos aquí, es porque usó ubicación actual (falta geocodificar destino)
    if (usingCurrentLocation) {
      // Solo geocodificar la dirección de entrega
      const deliveryCoords = await geocodeAddress(deliveryAddress);
      
      if (!deliveryCoords) {
        setError('No se pudo encontrar la dirección de entrega');
        setLoading(false);
        return;
      }
      
      const result = await createShipment({
        clientId: userData?.email,
        clientName: userData?.nombre,
        clientPhone: userData?.telefono,
        pickupAddress: finalPickupAddress,
        deliveryAddress: deliveryAddress,
        pickupCoords: pickupCoords,
        deliveryCoords: deliveryCoords,
        cargoType: cargoType,
        cargoWeight: parseFloat(cargoWeight),
        status: 'pending'
      });
      
      if (result.success) {
        alert('✅ Solicitud enviada. Espera a que un conductor acepte.');
        navigate('/');
      } else {
        setError(result.error);
      }
    }
    
    setLoading(false);
  };

  const useCurrentLocation = () => {
    if (userLocation) {
      setUsingCurrentLocation(true);
      setPickupAddress('');
    } else {
      setError('No se pudo obtener tu ubicación');
    }
  };

  const clearCurrentLocation = () => {
    setUsingCurrentLocation(false);
    setPickupAddress('');
  };

  if (!userData || userData.role !== 'cliente') {
    return (
      <div style={styles.container}>
        <h2>Acceso denegado</h2>
        <p>Solo clientes pueden solicitar envíos.</p>
        <button onClick={() => navigate('/')} style={styles.backButton}>Volver</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Volver al mapa
        </button>
        <h1 style={styles.title}>📦 Solicitar envío</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Dirección de recogida */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📍 Punto de recogida</h2>
          
          {usingCurrentLocation ? (
            <div style={styles.currentLocationBox}>
              <div style={styles.currentLocationIcon}>📍</div>
              <div style={styles.currentLocationText}>
                Usando tu ubicación actual
                <div style={styles.currentLocationCoords}>
                  Lat: {userLocation?.lat.toFixed(6)}, Lng: {userLocation?.lng.toFixed(6)}
                </div>
              </div>
              <button type="button" onClick={clearCurrentLocation} style={styles.clearLocationBtn}>
                ✖
              </button>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Ej: Calle 123, Pasto"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              style={styles.input}
            />
          )}
          
          <button type="button" onClick={useCurrentLocation} style={styles.locationButton}>
            📍 Usar mi ubicación actual
          </button>
        </div>

        {/* Dirección de entrega */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🏁 Punto de entrega</h2>
          
          <input
            type="text"
            placeholder="Ej: Carrera 45, Pasto"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        {/* Información de la carga */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📦 Información de la carga</h2>
          
          <select
            value={cargoType}
            onChange={(e) => setCargoType(e.target.value)}
            style={styles.select}
            required
          >
            <option value="">Selecciona tipo de carga</option>
            <option value="cajas">Cajas</option>
            <option value="paquetes">Paquetes</option>
            <option value="muebles">Muebles</option>
            <option value="electrodomesticos">Electrodomésticos</option>
            <option value="mercancia_industrial">Mercancía industrial</option>
            <option value="otro">Otro</option>
          </select>
          
          <div style={styles.weightRow}>
            <input
              type="number"
              step="1"
              placeholder="Peso en kilogramos"
              value={cargoWeight}
              onChange={(e) => setCargoWeight(e.target.value)}
              style={styles.weightInput}
              required
            />
            <span style={styles.weightUnit}>kg</span>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.submitButton}>
          {loading ? 'Procesando...' : '📤 Solicitar envío'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  backButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600'
  },
  form: {
    maxWidth: '500px',
    margin: '0 auto'
  },
  section: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px',
    background: 'white'
  },
  weightRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  weightInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  weightUnit: {
    fontSize: '14px',
    color: '#666'
  },
  locationButton: {
    width: '100%',
    padding: '10px',
    background: '#e8f5e9',
    color: '#4CAF50',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  currentLocationBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  currentLocationIcon: {
    fontSize: '24px'
  },
  currentLocationText: {
    flex: 1,
    fontSize: '14px',
    fontWeight: '500',
    color: '#2e7d32'
  },
  currentLocationCoords: {
    fontSize: '10px',
    color: '#555',
    marginTop: '4px'
  },
  clearLocationBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#666'
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  }
};