// src/pages/TripTracking.jsx
// Vista de seguimiento del viaje (cliente ve al conductor en el mapa)

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { getShipmentById } from '../services/shipmentService';
import 'leaflet/dist/leaflet.css';

// Icono para el conductor
const driverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono para el cliente
const clientIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const TripTracking = () => {
  const { shipmentId } = useParams();
  const shipmentIdFinal = id || shipmentId;
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);

  // Hook para ubicación en tiempo real
 const driverLocation = null;
const tripStatus = trip?.status || null;

  // Cargar información del viaje
  useEffect(() => {
    const loadTrip = async () => {
     const result = await getShipmentById(shipmentId);
     console.log('ENVIO FIREBASE:', result);
      if (result.success) {
        setTrip(result.data);
        setClientLocation({
  lat: result.data.pickupCoords?.lat,
  lng: result.data.pickupCoords?.lng
});
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    loadTrip();
  },  [shipmentId]);




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

  const isConductor = userData?.role === 'conductor';
  const isCliente = userData?.role === 'cliente';

  // Centro del mapa (ubicación del conductor si existe, si no la del cliente)
 console.log('driverLocation:', driverLocation);
console.log('clientLocation:', clientLocation);

const mapCenter =
  driverLocation?.lat && driverLocation?.lng
    ? [driverLocation.lat, driverLocation.lng]
    : clientLocation?.lat && clientLocation?.lng
    ? [clientLocation.lat, clientLocation.lng]
    : null;

    if (!mapCenter) {
  return (
    <div style={{ padding: '20px' }}>
      Esperando coordenadas...
    </div>
  );
}

  return (
    <div style={styles.container}>
      {/* Mapa */}
      <MapContainer
        center={mapCenter}
        zoom={14}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marcador del cliente (origen) */}
        {clientLocation && (
          <Marker position={[clientLocation.lat, clientLocation.lng]} icon={clientIcon}>
            <Popup>
              <strong>📍 Tu ubicación</strong><br />
              {trip?.clientName}
            </Popup>
          </Marker>
        )}

        {/* Marcador del conductor (en tiempo real) */}
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <strong>🛵 Conductor</strong><br />
              {trip?.piaggioName} - {trip?.piaggioPlaca}<br />
              <span style={{ fontSize: '11px', color: '#666' }}>
                Última actualización hace segundos
              </span>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Panel inferior con información */}
      <div style={styles.panel}>
        <div style={styles.statusBadge}>
          {tripStatus === 'accepted' && '✅ Conductor en camino'}
          {tripStatus === 'in_progress' && '🚀 Viaje en curso'}
          {tripStatus === 'completed' && '🏁 Viaje completado'}
        </div>
        
        <div style={styles.info}>
          <div style={styles.infoRow}>
            <span>🛵 Conductor:</span>
            <span>{trip?.driverName || 'Sin conductor'}</span>
          </div>
          <div style={styles.infoRow}>
            <span>🔢 Placa:</span>
           <span>{trip?.driverPhone || '---'}</span>
          </div>
          <div style={styles.infoRow}>
            <span>💰 Precio:</span>
            <span style={styles.price}>
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(trip?.estimatedPrice)}
            </span>
          </div>
        </div>

        <div style={styles.actions}>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Volver al mapa
          </button>
          
          {isCliente && tripStatus === 'completed' && (
            <button 
              onClick={() => navigate(`/rate-driver/${shipmentId}`)}
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
    background: '#e8f5e9',
    color: '#2e7d32',
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '12px'
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
  button: {
    padding: '12px 24px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  }
};