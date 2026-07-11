import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { updateShipmentStatus, updateDriverLocation } from '../services/shipmentService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import 'leaflet/dist/leaflet.css';
import { ChatModal } from '../components/ChatModal';


// ==================== ICONOS ====================
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
  const params = useParams();
  const shipmentIdFinal = params.id || params.shipmentId || '';
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripStatus, setTripStatus] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [pickupReady, setPickupReady] = useState(false);
  const [deliveryReady, setDeliveryReady] = useState(false);
  const [proximityMessage, setProximityMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const watchIdRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const statusRef = useRef(tripStatus);
  const shipmentRef = useRef(shipment);

  const isConductor = userData?.role === 'conductor';
  const isCliente = userData?.role === 'cliente';

  useEffect(() => {
    statusRef.current = tripStatus;
  }, [tripStatus]);

  useEffect(() => {
    shipmentRef.current = shipment;
  }, [shipment]);

  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000;
  }, []);

  const updateProximity = useCallback((location, shipmentData, status) => {
    if (!location || !shipmentData) {
      setPickupReady(false);
      setDeliveryReady(false);
      setProximityMessage('⏳ Esperando ubicación...');
      return;
    }

    const distanceToPickup = calculateDistance(
      location.lat, location.lng,
      shipmentData.pickupCoords.lat, shipmentData.pickupCoords.lng
    );

    const distanceToDelivery = shipmentData.deliveryCoords ? calculateDistance(
      location.lat, location.lng,
      shipmentData.deliveryCoords.lat, shipmentData.deliveryCoords.lng
    ) : Infinity;

    console.log('📏 Distancia a recogida:', Math.round(distanceToPickup), 'm');
    console.log('📏 Distancia a entrega:', Math.round(distanceToDelivery), 'm');

    if (status === 'accepted') {
      if (distanceToPickup <= 20 && distanceToPickup > 0) {
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

    if (status === 'in_progress') {
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
  }, [calculateDistance]);

  useEffect(() => {
    if (!shipmentIdFinal) return;
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, 'shipments', shipmentIdFinal),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          console.log('📦 Documento actualizado:', data);
          setShipment(data);
          setTripStatus(data.status || '');
          setError(null);
        } else {
          setError('Envío no encontrado');
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error en Firestore:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [shipmentIdFinal]);

  useEffect(() => {
    const location = currentLocation || shipment?.driverLocation;
    console.log('📍 Ubicación usada para proximidad:', location);
    if (shipment && location) {
      updateProximity(location, shipment, tripStatus);
    }
  }, [shipment, tripStatus, currentLocation, updateProximity]);

  useEffect(() => {
    if (!isConductor) {
      console.log('⏳ No es conductor, GPS desactivado');
      return;
    }

    const isActive = tripStatus === 'accepted' || tripStatus === 'in_progress';

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!isActive) {
      console.log('⏳ Viaje no activo, GPS detenido');
      return;
    }

    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocalización no soportada');
      return;
    }

    console.log('📍 Iniciando GPS para conductor...');

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        console.log('📍 GPS actualizado:', latitude, longitude);
        setCurrentLocation(location);
        try {
          await updateDriverLocation(shipmentIdFinal, latitude, longitude);
        } catch (error) {
          console.warn('⚠️ Error enviando ubicación:', error);
        }
      },
      (error) => {
        console.error('❌ Error GPS:', error);
        if (error.code === 1) {
          alert('⚠️ Permite el acceso a la ubicación en la configuración del navegador.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    watchIdRef.current = watchId;
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isConductor, tripStatus, shipmentIdFinal]);

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const handleArrivedPickup = async () => {
    if (!pickupReady) return;
    const result = await updateShipmentStatus(shipmentIdFinal, 'in_progress');
    if (result.success) {
      setTripStatus('in_progress');
      alert('✅ Carga recogida. ¡A entregar!');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  const handleArrivedDelivery = async () => {
    if (!deliveryReady) return;
    const result = await updateShipmentStatus(shipmentIdFinal, 'delivered');
    if (result.success) {
      setTripStatus('delivered');
      alert('✅ Envío completado. ¡Gracias!');
      navigate('/');
    } else {
      alert('❌ Error: ' + result.error);
    }
  };

  if (loading) return <div style={styles.container}>Cargando viaje...</div>;
  if (error) return (
    <div style={styles.container}>
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => navigate('/')} style={styles.button}>Volver al mapa</button>
    </div>
  );
  if (!shipment) return <div style={styles.container}>Envío no encontrado</div>;

  const displayLocation = currentLocation || shipment?.driverLocation;
  const mapCenter = displayLocation
    ? [displayLocation.lat, displayLocation.lng]
    : shipment.pickupCoords
    ? [shipment.pickupCoords.lat, shipment.pickupCoords.lng]
    : [4.6097, -74.0817];

  return (
    <div style={styles.container}>
      <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {shipment.pickupCoords && (
          <Marker position={[shipment.pickupCoords.lat, shipment.pickupCoords.lng]} icon={clientIcon}>
            <Popup><strong>📍 Punto de recogida</strong><br />{shipment.pickupAddress}</Popup>
          </Marker>
        )}
        {shipment.deliveryCoords && (
          <Marker position={[shipment.deliveryCoords.lat, shipment.deliveryCoords.lng]} icon={deliveryIcon}>
            <Popup><strong>🏁 Punto de entrega</strong><br />{shipment.deliveryAddress}</Popup>
          </Marker>
        )}
        {displayLocation && (
          <Marker position={[displayLocation.lat, displayLocation.lng]} icon={driverIcon}>
            <Popup><strong>🚚 Conductor</strong><br />{shipment.piaggioName} - {shipment.piaggioPlaca}</Popup>
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
          <div style={styles.proximityMessage(proximityMessage.includes('✅'))}>
            {proximityMessage}
          </div>
        )}

        <div style={styles.cargoInfo}>📦 {shipment.cargoType} - {shipment.cargoWeight} kg</div>

        <div style={styles.info}>
          <div style={styles.infoRow}><span>🚚 Conductor:</span><span>{shipment.driverName || 'Sin conductor'}</span></div>
          <div style={styles.infoRow}><span>📞 Contacto:</span><span>{shipment.driverPhone || '---'}</span></div>
          <div style={styles.infoRow}><span>💰 Precio:</span><span style={styles.price}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(shipment.estimatedPrice)}</span></div>
        </div>

        {isConductor && tripStatus === 'accepted' && (
          <button onClick={handleArrivedPickup} disabled={!pickupReady} style={styles.pickupButton(pickupReady)}>
            📦 Recoger mercancía {pickupReady ? '✅' : '🔒'}
          </button>
        )}

        {isConductor && tripStatus === 'in_progress' && (
          <button onClick={handleArrivedDelivery} disabled={!deliveryReady} style={styles.deliveryButton(deliveryReady)}>
            🏁 Entregar mercancía {deliveryReady ? '✅' : '🔒'}
          </button>
        )}

        <div style={styles.actions}>
          {isConductor && (tripStatus === 'accepted' || tripStatus === 'in_progress') && (
            <button
              onClick={() => setIsChatOpen(true)}
              style={{
                flex: 1,
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
              }}
            >
              💬 Chat con el cliente
            </button>
          )}

          {isCliente && (tripStatus === 'accepted' || tripStatus === 'in_progress') && (
            <button
              onClick={() => setIsChatOpen(true)}
              style={{
                flex: 1,
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
              }}
            >
              💬 Chat con el conductor
            </button>
          )}

          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Volver al mapa
          </button>

          {isCliente && tripStatus === 'delivered' && (
            <button onClick={() => navigate(`/rate-driver/${shipmentIdFinal}`)} style={styles.rateButton}>
              ⭐ Calificar viaje
            </button>
          )}
        </div>
      </div>

      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        shipmentId={shipmentIdFinal}
        userData={userData}
      />
    </div>
  );
};

const styles = {
  container: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  panel: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '16px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '60vh', overflowY: 'auto' },
  statusBadge: { textAlign: 'center', padding: '8px', borderRadius: '12px', background: '#e3f2fd', color: '#1565c0', fontWeight: '600', fontSize: '14px', marginBottom: '12px' },
  proximityMessage: (isSuccess) => ({ textAlign: 'center', padding: '8px', marginBottom: '12px', borderRadius: '8px', background: isSuccess ? '#e8f5e9' : '#fff3cd', color: isSuccess ? '#2e7d32' : '#856404', fontWeight: '500', fontSize: '14px' }),
  cargoInfo: { fontSize: '16px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' },
  info: { marginBottom: '16px' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px', borderBottom: '1px solid #eee' },
  price: { fontWeight: '600', color: '#4CAF50' },
  pickupButton: (ready) => ({ width: '100%', padding: '12px', background: ready ? '#007bff' : '#6c757d', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: ready ? 'pointer' : 'not-allowed', marginBottom: '8px', opacity: ready ? 1 : 0.6 }),
  deliveryButton: (ready) => ({ width: '100%', padding: '12px', background: ready ? '#28a745' : '#6c757d', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: ready ? 'pointer' : 'not-allowed', marginBottom: '8px', opacity: ready ? 1 : 0.6 }),
  actions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  backButton: { flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  rateButton: { flex: 1, padding: '12px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  button: { padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }
};