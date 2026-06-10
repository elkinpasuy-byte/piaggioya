// src/pages/DriverTripDetail.jsx
// Pantalla para conductor: mapa con ruta a recogida y luego a entrega

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { getShipmentById, updateShipmentStatus } from '../services/shipmentService';
import { useGeolocation } from '../hooks/useGeolocation';
import 'leaflet/dist/leaflet.css';

// Iconos
const driverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const pickupIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const deliveryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Componente para centrar el mapa
const MapController = ({ center, onMapReady }) => {
  const map = useMap();
  useEffect(() => {
    if (center && map) {
      map.setView(center, 13);
      if (onMapReady) onMapReady(map);
    }
  }, [center, map, onMapReady]);
  return null;
};

export const DriverTripDetail = () => {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  if (userData?.role !== 'conductor') {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      No tienes permiso para acceder a esta página.
    </div>
  );
}
  const { location: driverLocation } = useGeolocation();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);
  const [status, setStatus] = useState('');

  // Cargar envío
  useEffect(() => {
    const loadShipment = async () => {
      if (!shipmentId) {
        console.error('No hay shipmentId');
        setLoading(false);
        return;
      }
      
      console.log('Cargando envío:', shipmentId);
      const result = await getShipmentById(shipmentId);
      console.log('Resultado:', result);
      
      if (result.success) {
        setShipment(result.data);
        setStatus(result.data.status);
      } else {
        console.error('Error:', result.error);
      }
      setLoading(false);
    };
    loadShipment();
  }, [shipmentId]);

  // Función para calcular ruta (simplificada)
  const calculatePickupRoute = (driverLoc, pickupLoc) => {
    console.log('Calculando ruta a recogida:', driverLoc, pickupLoc);
    // Aquí iría la lógica de ruta
  };

  const calculateDeliveryRoute = (pickupLoc, deliveryLoc) => {
    console.log('Calculando ruta a entrega:', pickupLoc, deliveryLoc);
  };

  const handleArrivedPickup = async () => {
    await updateShipmentStatus(shipmentId, 'loaded');
    setStatus('loaded');
    if (shipment?.pickupCoords && shipment?.deliveryCoords) {
      calculateDeliveryRoute(shipment.pickupCoords, shipment.deliveryCoords);
    }
  };

  const handleArrivedDelivery = async () => {
    await updateShipmentStatus(shipmentId, 'delivered');
    setStatus('delivered');
    alert('✅ Envío completado');
    navigate('/driver/trips');
  };

  if (loading) {
    return <div style={styles.container}>Cargando...</div>;
  }

  if (!shipment) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <h2>Envío no encontrado</h2>
          <p>ID: {shipmentId}</p>
          <button onClick={() => navigate('/driver/trips')} style={styles.backButton}>
            ← Volver a envíos disponibles
          </button>
        </div>
      </div>
    );
  }

  const mapCenter = driverLocation 
    ? [driverLocation.lat, driverLocation.lng]
    : [4.6097, -74.0817];

  return (
    <div style={styles.container}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>🚚 Tu ubicación</Popup>
          </Marker>
        )}
        
        {shipment.pickupCoords && (
          <Marker position={[shipment.pickupCoords.lat, shipment.pickupCoords.lng]} icon={pickupIcon}>
            <Popup>📍 Recoger: {shipment.pickupAddress}</Popup>
          </Marker>
        )}
        
        {shipment.deliveryCoords && status === 'loaded' && (
          <Marker position={[shipment.deliveryCoords.lat, shipment.deliveryCoords.lng]} icon={deliveryIcon}>
            <Popup>🏁 Entregar: {shipment.deliveryAddress}</Popup>
          </Marker>
        )}
        
        <MapController center={mapCenter} onMapReady={setMapInstance} />
      </MapContainer>

      <div style={styles.panel}>
        <div style={styles.cargoInfo}>
          📦 {shipment.cargoType} - {shipment.cargoWeight} kg
        </div>
        
        <div style={styles.addresses}>
          <div>📍 {shipment.pickupAddress}</div>
          <div>🏁 {shipment.deliveryAddress}</div>
        </div>
        
        <div style={styles.buttons}>
          {status === 'accepted' && (
            <button onClick={handleArrivedPickup} style={styles.pickupButton}>
              📍 Llegué a recoger
            </button>
          )}
          
          {status === 'loaded' && (
            <button onClick={handleArrivedDelivery} style={styles.deliveryButton}>
              🏁 Llegué a entregar
            </button>
          )}
          
          {status === 'delivered' && (
            <div style={styles.completedMessage}>✅ Envío completado</div>
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
  errorBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '20px'
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
  cargoInfo: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
    textAlign: 'center'
  },
  addresses: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '12px',
    textAlign: 'center'
  },
  buttons: {
    marginTop: '8px'
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
    cursor: 'pointer'
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
    cursor: 'pointer'
  },
  completedMessage: {
    textAlign: 'center',
    padding: '12px',
    background: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '12px',
    fontWeight: '500'
  },
  backButton: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};