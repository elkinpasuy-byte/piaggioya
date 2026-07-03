// src/pages/TripTracking.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { getShipmentById, updateShipmentStatus, updateDriverLocation } from '../services/shipmentService';
import { useGeolocation } from '../hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';
import { getDistanceInMeters } from '../utils/distance';

// Iconos
const driverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const clientIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const TripTracking = () => {
  const { id, shipmentId } = useParams();
  const shipmentIdFinal = id || shipmentId;
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { location: driverLocation } = useGeolocation();



  
  // ===== DECLARAR ROLES =====
  const isConductor = userData?.role === 'conductor';
  const isCliente = userData?.role === 'cliente';
  
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripStatus, setTripStatus] = useState('');

  const [isNearPickup, setIsNearPickup] = useState(false);
  const [isNearDelivery, setIsNearDelivery] = useState(false);

  // ===== ESTADOS DE PROXIMIDAD =====
const [pickupReady, setPickupReady] = useState(false);
const [deliveryReady, setDeliveryReady] = useState(false);
const [proximityMessage, setProximityMessage] = useState('');

// ===== CALCULAR DISTANCIA (Haversine) =====
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // metros
};

// ===== EFECTO DE PROXIMIDAD =====
useEffect(() => {
  if (!driverLocation || !shipment) return;

  const distanceToPickup = calculateDistance(
    driverLocation.lat, driverLocation.lng,
    shipment.pickupCoords.lat, shipment.pickupCoords.lng
  );
  const distanceToDelivery = shipment.deliveryCoords ? calculateDistance(
    driverLocation.lat, driverLocation.lng,
    shipment.deliveryCoords.lat, shipment.deliveryCoords.lng
  ) : Infinity;

  // --- Lógica de recogida ---
  if (tripStatus === 'accepted') {
    if (distanceToPickup <= 10 && distanceToPickup > 0) {
      setPickupReady(true);
      setProximityMessage('✅ Has llegado al punto de recogida.');
    } else if (distanceToPickup <= 30) {
      setPickupReady(false);
      setProximityMessage('📍 Estás próximo al punto de recogida.');
    } else {
      setPickupReady(false);
      setProximityMessage(`📏 A ${Math.round(distanceToPickup)} m de la recogida`);
    }
  }

  // --- Lógica de entrega ---
  if (tripStatus === 'in_progress') {
    if (distanceToDelivery <= 10 && distanceToDelivery > 0) {
      setDeliveryReady(true);
      setProximityMessage('✅ Has llegado al destino.');
    } else if (distanceToDelivery <= 30) {
      setDeliveryReady(false);
      setProximityMessage('📍 Estás próximo al destino.');
    } else {
      setDeliveryReady(false);
      setProximityMessage(`📏 A ${Math.round(distanceToDelivery)} m del destino`);
    }
  }
}, [driverLocation, shipment, tripStatus]);

  // Cargar información del envío
  useEffect(() => {
    const loadShipment = async () => {
      const result = await getShipmentById(shipmentIdFinal);
      if (result.success) {
        setShipment(result.data);
        setTripStatus(result.data.status);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    loadShipment();
  }, [shipmentIdFinal]);

  

  // ===== COMPARTIR UBICACIÓN EN TIEMPO REAL (CONDUCTOR) =====
  useEffect(() => {
    let watchId = null;

    if (isConductor && (tripStatus === 'accepted' || tripStatus === 'in_progress')) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await updateDriverLocation(shipmentIdFinal, latitude, longitude);
          },
          (error) => {
            console.error('Error de geolocalización:', error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
          }
        );
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isConductor, tripStatus, shipmentIdFinal]);

  // ===== CALCULAR DISTANCIA A RECOGIDA Y ENTREGA =====
useEffect(() => {
  if (!driverLocation || !shipment) return;

  if (shipment.pickupCoords) {
    const distPickup = getDistanceInMeters(
      driverLocation.lat,
      driverLocation.lng,
      shipment.pickupCoords.lat,
      shipment.pickupCoords.lng
    );

    setIsNearPickup(distPickup <= 10);
  }

  if (shipment.deliveryCoords) {
    const distDelivery = getDistanceInMeters(
      driverLocation.lat,
      driverLocation.lng,
      shipment.deliveryCoords.lat,
      shipment.deliveryCoords.lng
    );

    setIsNearDelivery(distDelivery <= 30);
  }

}, [driverLocation, shipment]);

  // ===== HANDLERS PARA CONDUCTOR =====
  const handleArrivedPickup = async () => {
    const result = await updateShipmentStatus(shipmentIdFinal, 'in_progress');
    if (result.success) {
      setTripStatus('in_progress');
      alert('✅ Carga recogida. ¡A entregar!');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleArrivedDelivery = async () => {
    const result = await updateShipmentStatus(shipmentIdFinal, 'delivered');
    if (result.success) {
      setTripStatus('delivered');
      alert('✅ Envío completado. ¡Gracias!');
      navigate('/driver/trips');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  if (loading) {
    return <div style={styles.container}>Cargando viaje...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} style={styles.button}>
          Volver al mapa
        </button>
      </div>
    );
  }

  if (!shipment) {
    return <div style={styles.container}>Envío no encontrado</div>;
  }

  // Centro del mapa
  const mapCenter = driverLocation?.lat && driverLocation?.lng
    ? [driverLocation.lat, driverLocation.lng]
    : shipment.pickupCoords?.lat && shipment.pickupCoords?.lng
    ? [shipment.pickupCoords.lat, shipment.pickupCoords.lng]
    : [4.6097, -74.0817];

  return (
    <div style={styles.container}>
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shipment.pickupCoords && (
          <Marker position={[shipment.pickupCoords.lat, shipment.pickupCoords.lng]} icon={clientIcon}>
            <Popup>
              <strong>📍 Punto de recogida</strong><br />
              {shipment.pickupAddress}
            </Popup>
          </Marker>
        )}

        {shipment.deliveryCoords && (
          <Marker position={[shipment.deliveryCoords.lat, shipment.deliveryCoords.lng]} icon={deliveryIcon}>
            <Popup>
              <strong>🏁 Punto de entrega</strong><br />
              {shipment.deliveryAddress}
            </Popup>
          </Marker>
        )}

        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <strong>🚚 Tu ubicación</strong><br />
              {shipment.piaggioName} - {shipment.piaggioPlaca}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div style={styles.panel}>
        <div style={styles.statusBadge}>
          {tripStatus === 'accepted' && '✅ En camino a la recogida'}
          {tripStatus === 'in_progress' && '🚀 En viaje al destino'}
          {tripStatus === 'delivered' && '🏁 Viaje completado'}
        </div>
        
        {proximityMessage && (
        <div style={{
          textAlign: 'center',
          padding: '8px',
          marginBottom: '12px',
          borderRadius: '8px',
          background: proximityMessage.includes('✅') ? '#e8f5e9' : '#fff3cd',
          color: proximityMessage.includes('✅') ? '#2e7d32' : '#856404',
          fontWeight: '500',
          fontSize: '14px'
        }}>
          {proximityMessage}
        </div>
      )}
        <div style={styles.cargoInfo}>📦 {shipment.cargoType} - {shipment.cargoWeight} kg</div>
        
        <div style={styles.info}>
          <div style={styles.infoRow}>
            <span>🚚 Conductor:</span>
            <span>{shipment.driverName || 'Sin conductor'}</span>
          </div>
          <div style={styles.infoRow}>
            <span>📞 Contacto:</span>
            <span>{shipment.driverPhone || '---'}</span>
          </div>
          <div style={styles.infoRow}>
            <span>💰 Precio:</span>
            <span style={styles.price}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(shipment.estimatedPrice)}
            </span>
          </div>
        </div>

        
        {/* Botón de recogida (solo para conductor) */}
{isConductor && tripStatus === 'accepted' && (
  <button
    onClick={handleArrivedPickup}
    disabled={!pickupReady}
    style={{
      ...styles.pickupButton,
      opacity: pickupReady ? 1 : 0.5,
      cursor: pickupReady ? 'pointer' : 'not-allowed'
    }}
  >
    📦 Recoger mercancía
  </button>
)}

{/* Botón de entrega (solo para conductor) */}
{isConductor && tripStatus === 'in_progress' && (
  <button
    onClick={handleArrivedDelivery}
    disabled={!deliveryReady}
    style={{
      ...styles.deliveryButton,
      opacity: deliveryReady ? 1 : 0.5,
      cursor: deliveryReady ? 'pointer' : 'not-allowed'
    }}
  >
    🏁 Entregar mercancía
  </button>
)}

        <div style={styles.actions}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Volver al mapa
          </button>
          
          {isCliente && tripStatus === 'delivered' && (
            <button 
              onClick={() => navigate(`/rate-driver/${shipmentIdFinal}`)}
              style={styles.rateButton}
            >
              ⭐ Calificar viaje
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%'
  },
  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '20px 20px 0 0',
    padding: '16px 20px',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
    zIndex: 1000
  },
  statusBadge: {
    textAlign: 'center',
    padding: '8px',
    borderRadius: '12px',
    background: '#e3f2fd',
    color: '#1565c0',
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '12px'
  },
  cargoInfo: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'center'
  },
  info: {
    marginBottom: '16px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    fontSize: '14px',
    borderBottom: '1px solid #eee'
  },
  price: {
    fontWeight: '600',
    color: '#4CAF50'
  },
  actions: {
    display: 'flex',
    gap: '12px'
  },
  backButton: {
    flex: 1,
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  rateButton: {
    flex: 1,
    padding: '12px',
    background: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  pickupButton: {
    width: '100%',
    padding: '12px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  deliveryButton: {
    width: '100%',
    padding: '12px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '8px'
  },
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },

  pickupButtonDisabled: {
  opacity: 0.5,
  cursor: 'not-allowed'
},

deliveryButtonDisabled: {
  opacity: 0.5,
  cursor: 'not-allowed'
}
};
