import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { updateShipmentStatus, updateDriverLocation } from '../services/shipmentService';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import 'leaflet/dist/leaflet.css';
import { ChatModal } from '../components/ChatModal';
import toast, { Toaster } from 'react-hot-toast';

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
  const [proposedPrice, setProposedPrice] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const watchIdRef = useRef(null);
  const unsubscribeRef = useRef(null);

  const isConductor = userData?.role === 'conductor';
  const isCliente = userData?.role === 'cliente';

  // ===== CALCULAR DISTANCIA =====
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

  // ===== ACTUALIZAR PROXIMIDAD =====
  const updateProximity = useCallback((location, shipmentData, status) => {
    // Si el viaje ya terminó o fue cancelado
    if (status === 'delivered') {
      setPickupReady(false);
      setDeliveryReady(false);
      setProximityMessage(isCliente 
        ? '⭐ ¡Viaje completado! Califica a tu conductor.' 
        : '💪 ¡Misión cumplida! Sos un crack. 🏆');
      return;
    }

    if (status === 'cancelled') {
      setPickupReady(false);
      setDeliveryReady(false);
      setProximityMessage('❌ Viaje cancelado');
      return;
    }

    // Si no hay ubicación
    if (!location || !shipmentData) {
      setPickupReady(false);
      setDeliveryReady(false);
      setProximityMessage(isCliente 
        ? '⏳ Esperando que el conductor comparta su ubicación...' 
        : '⏳ Esperando ubicación...');
      return;
    }

    // Solo calcular distancias si el estado es 'accepted' o 'in_progress'
    if (status !== 'accepted' && status !== 'in_progress') {
      setPickupReady(false);
      setDeliveryReady(false);
      // Mensajes específicos para negociación
      if (status === 'assigned' || (status === 'accepted' && !shipmentData.agreedPrice)) {
        setProximityMessage(isConductor 
          ? '⚖️ Oferta enviada, esperando respuesta del cliente...' 
          : '📋 Revisa la oferta del conductor y decide: Aceptar o Rechazar');
      } else {
        setProximityMessage('⚖️ Esperando confirmación...');
      }
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
      // Mensaje para el cliente cuando el conductor está en camino
      if (isCliente) {
        setPickupReady(false);
        setDeliveryReady(false);
        setProximityMessage('✅ Conductor en camino hacia la recogida');
        return;
      }

      // Conductor: mensajes de proximidad a recogida
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
      // Mensaje para el cliente
      if (isCliente) {
        setPickupReady(false);
        setDeliveryReady(false);
        setProximityMessage('🚚 Tu carga está en camino hacia el destino');
        return;
      }

      // Conductor: mensajes de proximidad a entrega
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
  }, [calculateDistance, isCliente, isConductor]);

  // ===== SUSCRIPCIÓN EN TIEMPO REAL =====
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
          if (data.agreedPrice) data.agreedPrice = Number(data.agreedPrice);
          if (data.proposedPrice) data.proposedPrice = Number(data.proposedPrice);
          if (data.estimatedPrice) data.estimatedPrice = Number(data.estimatedPrice);
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

  // ===== EFECTO DE PROXIMIDAD =====
  useEffect(() => {
    const location = currentLocation || shipment?.driverLocation;
    if (shipment) {
      updateProximity(location, shipment, tripStatus);
    }
  }, [shipment, tripStatus, currentLocation, updateProximity]);

  // ===== GPS DEL CONDUCTOR =====
  useEffect(() => {
    if (!isConductor) {
      return;
    }

    const isActive = tripStatus === 'accepted' || tripStatus === 'in_progress';

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!isActive) {
      return;
    }

    if (!navigator.geolocation) {
      toast.error('⚠️ Geolocalización no soportada');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
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
          toast.error('⚠️ Permite el acceso a la ubicación en la configuración del navegador.');
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

  // ===== CLEANUP FINAL =====
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

  // ===== HANDLERS =====
  const handleArrivedPickup = async () => {
    if (!pickupReady) return;
    const result = await updateShipmentStatus(shipmentIdFinal, 'in_progress');
    if (result.success) {
      setTripStatus('in_progress');
      toast.success('✅ Carga recogida. ¡A entregar!');
    } else {
      toast.error('❌ Error: ' + result.error);
    }
  };

  const handleArrivedDelivery = async () => {
    if (!deliveryReady) return;
    const result = await updateShipmentStatus(shipmentIdFinal, 'delivered');
    if (result.success) {
      setTripStatus('delivered');
      toast.success('✅ Mercancía entregada. ¡Gracias!');
      if (isConductor) {
        setTimeout(() => navigate('/driver/home'), 3000);
      }
    } else {
      toast.error('❌ Error: ' + result.error);
    }
  };

  // ===== PROPUESTA DE PRECIO =====
  const handleProposePrice = async () => {
    if (!proposedPrice || parseFloat(proposedPrice) <= 0) {
      toast.error('Ingresa un valor válido');
      return;
    }

    try {
      await updateDoc(doc(db, 'shipments', shipmentIdFinal), {
        proposedPrice: parseFloat(proposedPrice)
      });
      toast.success('✅ Propuesta enviada al cliente. Espera su confirmación.');
      setProposedPrice('');
    } catch (error) {
      toast.error('❌ Error al enviar propuesta: ' + error.message);
    }
  };

  // ===== ACEPTAR / RECHAZAR PROPUESTA =====
  const handleAcceptPrice = async () => {
    if (!shipment?.proposedPrice) return;
    try {
      await updateDoc(doc(db, 'shipments', shipmentIdFinal), {
        agreedPrice: shipment.proposedPrice,
        proposedPrice: null,
        status: 'accepted'
      });
      toast.success('✅ Precio acordado: $' + shipment.proposedPrice.toLocaleString());
    } catch (error) {
      toast.error('❌ Error al aceptar: ' + error.message);
    }
  };

  const handleRejectPrice = async () => {
    try {
      await updateDoc(doc(db, 'shipments', shipmentIdFinal), {
        proposedPrice: null
      });
      toast.success('❌ Has rechazado la propuesta. El conductor podrá enviar otra.');
    } catch (error) {
      toast.error('❌ Error al rechazar: ' + error.message);
    }
  };

  // ===== CANCELAR VIAJE =====
  const handleCancelTrip = async () => {
    if (!window.confirm('¿Estás seguro de cancelar este viaje?')) return;
    
    setIsCancelling(true);
    try {
      await updateDoc(doc(db, 'shipments', shipmentIdFinal), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancelledBy: userData?.role || 'unknown'
      });
      toast.success('❌ Viaje cancelado');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      toast.error('❌ Error al cancelar: ' + error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // ===== FUNCIÓN PARA MOSTRAR EL PRECIO =====
  const getPriceDisplay = () => {
    const { agreedPrice, proposedPrice, estimatedPrice } = shipment;
    const agreed = Number(agreedPrice);
    const proposed = Number(proposedPrice);
    const estimated = Number(estimatedPrice);

    if (agreed > 0) {
      return <span style={styles.priceBadge('agreed')}>✅ ${agreed.toLocaleString()}</span>;
    }

    if (proposed > 0) {
      return <span style={styles.priceBadge('proposed')}>⏳ Propuesta: ${proposed.toLocaleString()}</span>;
    }

    if (estimated > 0) {
      return <span style={styles.priceBadge('estimated')}>💰 ${estimated.toLocaleString()}</span>;
    }

    return <span style={styles.priceBadge('none')}>⏳ Por acordar</span>;
  };

  // ===== FUNCIÓN PARA BADGE DE ESTADO =====
  const getStatusBadge = () => {
    switch (tripStatus) {
      case 'accepted':
        return shipment?.agreedPrice 
          ? (isConductor ? '✅ Rumbo a la carga' : '✅ Conductor en camino')
          : (isConductor ? '⚖️ Oferta enviada, esperando respuesta' : '📋 Revisa la oferta del conductor');
      case 'in_progress':
        return isConductor ? '🚚 Carga en ruta a destino' : '🚚 Tu carga está en camino';
      case 'delivered':
        return isConductor ? '🏁 ¡Viaje completado! Gracias.' : '🏁 ¡Entregado! Califica al conductor ⭐';
      case 'cancelled':
        return '❌ Viaje cancelado';
      default:
        return tripStatus;
    }
  };

  // ===== RENDER =====
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

  const canCancel = ['accepted', 'in_progress'].includes(tripStatus);

  return (
    <div style={styles.container}>
      <Toaster position="top-center" />
      
      <MapContainer 
        center={mapCenter} 
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
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
        <div style={styles.infoContainer}>
          <div style={styles.statusBadge}>
            {getStatusBadge()}
          </div>

          {proximityMessage && (
            <div style={styles.proximityMessage(proximityMessage.includes('✅') || proximityMessage.includes('⭐'))}>
              {proximityMessage}
            </div>
          )}

          <div style={styles.cargoInfo}>📦 {shipment.cargoType} - {shipment.cargoWeight} kg</div>

          <div style={styles.info}>
            <div style={styles.infoRow}>
              <span>📍 Recogida:</span>
              <span>{shipment.pickupAddress}</span>
            </div>
            <div style={styles.infoRow}>
              <span>🏁 Entrega:</span>
              <span>{shipment.deliveryAddress}</span>
            </div>
            <div style={styles.infoRow}>
              <span>🚚 Conductor:</span>
              <span>{shipment.driverName || 'Sin conductor'}</span>
            </div>
            <div style={styles.infoRow}>
              <span>💰 Precio:</span>
              <span>{getPriceDisplay()}</span>
            </div>
          </div>

          {/* ===== CONDUCTOR: PROPONER PRECIO ===== */}
          {isConductor && tripStatus === 'accepted' && !shipment.agreedPrice && !shipment.proposedPrice && (
            <div style={styles.priceSection}>
              <div style={styles.priceLabel}>💰 Propón un precio para el flete</div>
              <div style={styles.priceInputGroup}>
                <input
                  type="number"
                  placeholder="Ingresa el valor en COP"
                  value={proposedPrice}
                  onChange={(e) => setProposedPrice(e.target.value)}
                  style={styles.priceInput}
                />
                <button
                  onClick={handleProposePrice}
                  disabled={!proposedPrice || parseFloat(proposedPrice) <= 0}
                  style={styles.priceButton}
                >
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* ===== CLIENTE: ACEPTAR/RECHAZAR PROPUESTA ===== */}
          {isCliente && tripStatus === 'accepted' && shipment.proposedPrice && !shipment.agreedPrice && (
            <div style={styles.proposalBox}>
              <p style={styles.proposalText}>
                El conductor propone: <strong>${Number(shipment.proposedPrice).toLocaleString()}</strong>
              </p>
              <div style={styles.proposalActions}>
                <button onClick={handleAcceptPrice} style={styles.acceptButton}>
                  ✅ Aceptar
                </button>
                <button onClick={handleRejectPrice} style={styles.rejectButton}>
                  ❌ Rechazar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== CONTENEDOR DE ACCIONES ===== */}
        <div style={styles.actionsContainer}>
          {isConductor && tripStatus === 'accepted' && shipment.agreedPrice && (
            <button onClick={handleArrivedPickup} disabled={!pickupReady} style={styles.pickupButton(pickupReady)}>
              📦 Recoger {pickupReady ? '✅' : '🔒'}
            </button>
          )}

          {isConductor && tripStatus === 'in_progress' && (
            <button onClick={handleArrivedDelivery} disabled={!deliveryReady} style={styles.deliveryButton(deliveryReady)}>
              🏁 Entregar {deliveryReady ? '✅' : '🔒'}
            </button>
          )}

          <div style={styles.secondaryActions}>
            {(isConductor || isCliente) && (tripStatus === 'accepted' || tripStatus === 'in_progress') && (
              <button onClick={() => setIsChatOpen(true)} style={styles.chatButton}>
                💬
              </button>
            )}

            {canCancel && (
              <button onClick={handleCancelTrip} disabled={isCancelling} style={styles.cancelButton}>
                {isCancelling ? '...' : '❌'}
              </button>
            )}

            <button onClick={() => navigate('/')} style={styles.backButton}>
              ←
            </button>
          </div>

          {isCliente && tripStatus === 'delivered' && (
            <button onClick={() => navigate(`/rate-driver/${shipmentIdFinal}`)} style={styles.rateButton}>
              ⭐ Calificar
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
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    background: '#f5f5f5'
  },

  // ===== PANEL PRINCIPAL =====
  panel: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'white',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -8px 30px rgba(0,0,0,0.12)',
    zIndex: 1000,
    height: 'auto',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '16px 16px 0 16px',
    paddingBottom: 'env(safe-area-inset-bottom)',
  },

  // ===== CONTENIDO SCROLLABLE =====
  infoContainer: {
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
    paddingBottom: '12px',
    marginBottom: '4px',
  },

  // ===== BOTONES SIEMPRE VISIBLES =====
  actionsContainer: {
    flexShrink: 0,
    paddingTop: '12px',
    paddingBottom: '12px',
    borderTop: '1px solid #f0f0f0',
    background: 'white',
    position: 'relative',
    zIndex: 2,
    display: 'block',
    opacity: 1,
    height: 'auto',
    minHeight: '60px',
    overflow: 'visible',
  },

  // ===== RESTO DE ESTILOS =====
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
  proximityMessage: (isSuccess) => ({
    textAlign: 'center',
    padding: '8px',
    marginBottom: '12px',
    borderRadius: '8px',
    background: isSuccess ? '#e8f5e9' : '#fff3cd',
    color: isSuccess ? '#2e7d32' : '#856404',
    fontWeight: '500',
    fontSize: '14px'
  }),
  cargoInfo: { fontSize: '16px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' },
  info: { marginBottom: '12px' },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '14px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center'
  },
  priceBadge: (type) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    background: type === 'agreed' ? '#d4edda' :
                type === 'proposed' ? '#fff3cd' :
                type === 'estimated' ? '#e3f2fd' : '#f8f9fa',
    color: type === 'agreed' ? '#155724' :
           type === 'proposed' ? '#856404' :
           type === 'estimated' ? '#0c5460' : '#6c757d',
    border: `1px solid ${type === 'agreed' ? '#c3e6cb' :
                           type === 'proposed' ? '#ffe8a1' :
                           type === 'estimated' ? '#b8daff' : '#dee2e6'}`
  }),
  priceSection: { marginBottom: '12px', padding: '12px', background: '#f8f9ff', borderRadius: '12px' },
  priceLabel: { fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#1a1a2e' },
  priceInputGroup: { display: 'flex', gap: '8px' },
  priceInput: { flex: 1, padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' },
  priceButton: {
    padding: '10px 20px',
    background: '#667eea',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  proposalBox: {
    marginBottom: '12px',
    padding: '16px',
    background: '#fff3cd',
    borderRadius: '12px',
    border: '1px solid #ffe8a1'
  },
  proposalText: {
    fontSize: '15px',
    marginBottom: '12px',
    textAlign: 'center',
    color: '#856404'
  },
  proposalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  acceptButton: {
    padding: '10px 24px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1
  },
  rejectButton: {
    padding: '10px 24px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1
  },
  pickupButton: (ready) => ({
    width: '100%',
    padding: '12px',
    background: ready ? '#007bff' : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: ready ? 'pointer' : 'not-allowed',
    opacity: ready ? 1 : 0.6
  }),
  deliveryButton: (ready) => ({
    width: '100%',
    padding: '12px',
    background: ready ? '#28a745' : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: ready ? 'pointer' : 'not-allowed',
    opacity: ready ? 1 : 0.6
  }),
  secondaryActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    justifyContent: 'space-between'
  },
  chatButton: {
    padding: '10px 16px',
    background: '#25D366',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    padding: '10px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButton: {
    padding: '10px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    cursor: 'pointer',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rateButton: {
    width: '100%',
    padding: '12px',
    background: '#ffc107',
    color: '#333',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  button: { padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }
};