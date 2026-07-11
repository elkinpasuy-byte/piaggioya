// src/pages/client/ClientTrip.jsx
// Cliente: ve el estado del envío, la ubicación del conductor y puede chatear

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import 'leaflet/dist/leaflet.css';

const pickupIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const deliveryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ClientTrip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, 'shipments', id),
      (docSnap) => {
        if (docSnap.exists()) {
          setShipment({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Envío no encontrado');
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const getStatusText = (status) => ({
    pending: '⏳ Pendiente',
    accepted: '✅ Conductor en camino',
    in_progress: '🚚 En ruta',
    delivered: '🏁 Entregado'
  }[status] || status);

  if (loading) return <div style={styles.loading}>Cargando...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!shipment) return <div style={styles.error}>Envío no encontrado</div>;

  const mapCenter = shipment.driverLocation
    ? [shipment.driverLocation.lat, shipment.driverLocation.lng]
    : shipment.pickupCoords
    ? [shipment.pickupCoords.lat, shipment.pickupCoords.lng]
    : [4.6097, -74.0817];

  const canChat = shipment.status === 'accepted' || shipment.status === 'in_progress';

  return (
    <div style={styles.container}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {shipment.pickupCoords && (
          <Marker position={[shipment.pickupCoords.lat, shipment.pickupCoords.lng]} icon={pickupIcon}>
            <Popup><strong>📍 Recogida</strong><br />{shipment.pickupAddress}</Popup>
          </Marker>
        )}

        {shipment.deliveryCoords && (
          <Marker position={[shipment.deliveryCoords.lat, shipment.deliveryCoords.lng]} icon={deliveryIcon}>
            <Popup><strong>🏁 Entrega</strong><br />{shipment.deliveryAddress}</Popup>
          </Marker>
        )}

        {shipment.driverLocation && (
          <Marker position={[shipment.driverLocation.lat, shipment.driverLocation.lng]} icon={driverIcon}>
            <Popup><strong>🚚 Conductor</strong><br />{shipment.driverName}</Popup>
          </Marker>
        )}
      </MapContainer>

      <div style={styles.panel}>
        <div style={styles.statusBadge}>{getStatusText(shipment.status)}</div>
        <div style={styles.cargoInfo}>📦 {shipment.cargoType} - {shipment.cargoWeight} kg</div>
        <div style={styles.info}>
          <div style={styles.infoRow}><span>📍 Recogida:</span><span>{shipment.pickupAddress}</span></div>
          <div style={styles.infoRow}><span>🏁 Entrega:</span><span>{shipment.deliveryAddress}</span></div>
          <div style={styles.infoRow}><span>🚚 Conductor:</span><span>{shipment.driverName || 'Sin asignar'}</span></div>
          <div style={styles.infoRow}><span>💰 Precio:</span><span style={styles.price}>${shipment.estimatedPrice?.toLocaleString() || 'N/A'}</span></div>
        </div>

        {canChat && (
          <button
            onClick={() => navigate(`/chat/${id}`)}
            style={{
              width: '100%',
              padding: '12px',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '12px',
            }}
          >
            💬 Chat con el conductor
          </button>
        )}

        <button onClick={() => navigate(-1)} style={styles.backButton}>← Volver</button>
      </div>
    </div>
  );
}

const styles = {
  container: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  panel: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', zIndex: 1000 },
  statusBadge: { textAlign: 'center', padding: '8px', borderRadius: '12px', background: '#e3f2fd', color: '#1565c0', fontWeight: '600', fontSize: '14px', marginBottom: '12px' },
  cargoInfo: { fontSize: '16px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' },
  info: { marginBottom: '16px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid #eee' },
  price: { fontWeight: '600', color: '#4CAF50' },
  backButton: { width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px' },
  error: { textAlign: 'center', padding: '40px', color: 'red' }
};