import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../contexts/AuthContext';
import { updateShipmentStatus, updateDriverLocation } from '../../services/shipmentService';
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

export default function DriverTrip() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripStatus, setTripStatus] = useState('');
  const [pickupReady, setPickupReady] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [proximityMessage, setProximityMessage] = useState('');

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000;
  };

  useEffect(() => {
    if (!shipmentId) return;
    console.log('🔄 Iniciando onSnapshot para:', shipmentId);

    const unsubscribe = onSnapshot(
    doc(db, 'shipments', shipmentId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log('📦 Datos recibidos en tiempo real:', data);
        console.log('📍 driverLocation:', data.driverLocation);
        console.log('📍 pickupCoords:', data.pickupCoords);
        setShipment(data);
        setTripStatus(data.status || '');
      } else {
        console.warn('❌ Documento no existe');
      }
      setLoading(false);
    },
    (err) => {
      console.error('❌ Error en onSnapshot:', err);
      setError(err.message);
      setLoading(false);
    }
  );
  return () => unsubscribe();
}, [shipmentId]);

  // 👇 CORREGIDO: Dependencia en shipment?.driverLocation
 useEffect(() => {
  const driverLoc = shipment?.driverLocation;

  console.log("📌 driverLoc:", driverLoc);
  console.log("📌 pickupCoords:", shipment?.pickupCoords);

  if (!driverLoc || !shipment) {
    console.log("⏳ Esperando driverLocation o shipment...");
    return;
  }

  const distanceToPickup = calculateDistance(
    driverLoc.lat,
    driverLoc.lng,
    shipment.pickupCoords.lat,
    shipment.pickupCoords.lng
  );

  const distanceToDelivery = shipment.deliveryCoords
    ? calculateDistance(
        driverLoc.lat,
        driverLoc.lng,
        shipment.deliveryCoords.lat,
        shipment.deliveryCoords.lng
      )
    : Infinity;

  console.log("📏 Distancia recogida:", Math.round(distanceToPickup));
  console.log("📏 Distancia entrega:", Math.round(distanceToDelivery));
  console.log("🚚 tripStatus:", tripStatus);
  console.log("🔘 pickupReady:", pickupReady);

  if (tripStatus === "accepted") {
    if (distanceToPickup <= 10) {
      console.log("✅ Llegó a recogida");
      setPickupReady(true);
      setProximityMessage("✅ Has llegado al punto de recogida.");
    } else if (distanceToPickup <= 30) {
      setPickupReady(false);
      setProximityMessage("📍 Estás próximo al punto de recogida.");
    } else {
      setPickupReady(false);
      setProximityMessage(`📏 A ${Math.round(distanceToPickup)} m de la recogida`);
    }
  }

  if (tripStatus === "in_progress") {
    if (distanceToDelivery <= 10) {
      setDeliveryReady(true);
      setProximityMessage("✅ Has llegado al destino.");
    } else if (distanceToDelivery <= 30) {
      setDeliveryReady(false);
      setProximityMessage("📍 Estás próximo al destino.");
    } else {
      setDeliveryReady(false);
      setProximityMessage(`📏 A ${Math.round(distanceToDelivery)} m del destino`);
    }
  }

}, [shipment?.driverLocation, tripStatus]);// ← Dependencia corregida

  useEffect(() => {
    let watchId = null;
    if (tripStatus === 'accepted' || tripStatus === 'in_progress') {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
  async (position) => {
    const { latitude, longitude } = position.coords;
    console.log('📍 GPS enviando:', latitude, longitude);
    await updateDriverLocation(shipmentId, latitude, longitude);
    console.log('✅ Ubicación guardada en Firestore');
  },
  (err) => console.error('❌ GPS error:', err),
  { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
);
      }
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tripStatus, shipmentId]);

  const handlePickup = async () => {
    const result = await updateShipmentStatus(shipmentId, 'in_progress');
    if (result.success) {
      setTripStatus('in_progress');
      alert('✅ Carga recogida. ¡A entregar!');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleDelivery = async () => {
    const result = await updateShipmentStatus(shipmentId, 'delivered');
    if (result.success) {
      setTripStatus('delivered');
      alert('✅ Envío completado. ¡Gracias!');
      navigate('/driver/trips');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  if (loading) return <div style={styles.loading}>Cargando viaje...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;
  if (!shipment) return <div style={styles.error}>Envío no encontrado</div>;

  const mapCenter = shipment.driverLocation
    ? [shipment.driverLocation.lat, shipment.driverLocation.lng]
    : shipment.pickupCoords
    ? [shipment.pickupCoords.lat, shipment.pickupCoords.lng]
    : [4.6097, -74.0817];

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
            <Popup><strong>🚚 Tu ubicación</strong></Popup>
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
          <div style={styles.infoRow}><span>📍 Recogida:</span><span>{shipment.pickupAddress}</span></div>
          <div style={styles.infoRow}><span>🏁 Entrega:</span><span>{shipment.deliveryAddress}</span></div>
          <div style={styles.infoRow}><span>💰 Precio:</span><span style={styles.price}>${shipment.estimatedPrice?.toLocaleString() || 'N/A'}</span></div>
        </div>

        {tripStatus === 'accepted' && (
          <button onClick={handlePickup} disabled={!pickupReady} style={{ ...styles.actionButton, opacity: pickupReady ? 1 : 0.5, cursor: pickupReady ? 'pointer' : 'not-allowed', background: '#007bff' }}>
            📦 Recoger mercancía
          </button>
        )}

        {tripStatus === 'in_progress' && (
          <button onClick={handleDelivery} disabled={!deliveryReady} style={{ ...styles.actionButton, opacity: deliveryReady ? 1 : 0.5, cursor: deliveryReady ? 'pointer' : 'not-allowed', background: '#28a745' }}>
            🏁 Entregar mercancía
          </button>
        )}

        <button onClick={() => navigate('/driver/trips')} style={styles.backButton}>← Volver a envíos</button>
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
  actionButton: { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginBottom: '8px' },
  backButton: { width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '40px' },
  error: { textAlign: 'center', padding: '40px', color: 'red' }
};