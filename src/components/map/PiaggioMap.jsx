// ========== IMPORTS ==========
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useRef, useEffect } from 'react';

// ========== COMPONENTES ==========
import { LocationMarker } from './LocationMarker';
import { PiaggioMarkers } from './PiaggioMarkers';
import { PiaggioPanel } from '../PiaggioPanel/PiaggioPanel';

// ========== HOOKS ==========
import { useRealTimePiaggios } from '../../hooks/useRealTimePiaggios';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useRoute } from '../../hooks/useRoute';

import { useAuth } from '../../contexts/AuthContext';

// ========== MODAL ==========
import { ConfirmTripModal } from '../modals/ConfirmTripModal';
import { createShipment } from '../../services/shipmentService';

// ========== ICONOS LEAFLET ==========
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ========== MAP CONTROLLER ==========
const MapController = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);

  return null;
};

// ========== COMPONENTE PRINCIPAL ==========
export const PiaggioMap = ({ userLocation }) => {
  const { piaggios, lastUpdate } = useRealTimePiaggios(userLocation, 4000);
  const [favoriteId, setFavoriteId] = useLocalStorage(
    'piaggiaya_favorite',
    null
  );

  const [selectedPiaggio, setSelectedPiaggio] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationTimeoutRef = useRef(null);

  const [mapInstance, setMapInstance] = useState(null);
  const { routeInfo, isCalculating, calculateRoute, clearRoute } =
    useRoute(mapInstance);

  const { userData } = useAuth();
  const [tripLoading, setTripLoading] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

  // ========== LIMPIEZA NOTIFICACIONES ==========
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // ========== CALCULAR DISTANCIA ==========
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      lat1 == null ||
      lon1 == null ||
      lat2 == null ||
      lon2 == null
    )
      return 0;

    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // ========== ABRIR MODAL ==========
  const openConfirmModal = (piaggio, distance, duration, price) => {
    setSelectedTripDetails({
      piaggioId: piaggio.id,
      piaggioName: piaggio.nombre,
      piaggioPlaca: piaggio.placa,
      distance,
      distanceFormatted:
        distance < 1
          ? `${Math.round(distance * 1000)} m`
          : `${distance.toFixed(1)} km`,
      durationFormatted:
        duration < 1 ? '< 1 min' : `${Math.round(duration)} min`,
      estimatedPrice: price,
    });

    setShowConfirmModal(true);
  };

  // ========== SOLICITAR VIAJE ==========
 const handleRequestTrip = async () => {
  if (!selectedTripDetails) return;
  
  const shipmentData = {
    clientId: userData?.email,
    clientName: userData?.nombre,
    clientPhone: userData?.telefono,
    pickupAddress: selectedTripDetails.pickupAddress || 'Dirección no especificada',
    deliveryAddress: selectedTripDetails.deliveryAddress || 'Dirección no especificada',
    pickupCoords: { lat: userLocation?.lat, lng: userLocation?.lng },
    deliveryCoords: { lat: userLocation?.lat + 0.01, lng: userLocation?.lng + 0.01 },
    cargoType: selectedTripDetails.cargoType || 'General',
    cargoWeight: selectedTripDetails.cargoWeight || 50,
    status: 'pending'
  };
  
  const result = await createShipment(shipmentData);
  
  if (result.success) {
    setShowConfirmModal(false);
    setSelectedTripDetails(null);
    setNotificationMessage('✅ Envío solicitado con éxito');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  } else {
    setNotificationMessage('❌ Error: ' + result.error);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  }
};

  // ========== SELECCIONAR PIAGGIO ==========
  const handlePiaggioSelect = useCallback(
    (piaggio) => {
      if (piaggio.estado !== 'disponible') {
        setNotificationMessage(
          `❌ ${piaggio.nombre} no está disponible`
        );
        setShowNotification(true);
        return;
      }

      if (mapInstance && userLocation && piaggio.coordenadas) {
        calculateRoute(
          { lat: userLocation.lat, lng: userLocation.lng },
          piaggio.coordenadas
        );
      }

      setSelectedPiaggio(piaggio);

      setNotificationMessage(`✅ ${piaggio.nombre} seleccionado`);
      setShowNotification(true);

      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => {
        setShowNotification(false);
        setSelectedPiaggio(null);
      }, 3000);
    },
    [mapInstance, userLocation, calculateRoute]
  );

  // ========== FAVORITOS ==========
  const handleToggleFavorite = useCallback(
    (piaggioId) => {
      if (favoriteId === piaggioId) {
        setFavoriteId(null);
        setNotificationMessage('⭐ Eliminado de favoritos');
      } else {
        setFavoriteId(piaggioId);
        setNotificationMessage('⭐ Agregado a favoritos');
      }

      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    },
    [favoriteId, setFavoriteId]
  );

  // ========== LOADING ==========
  if (!userLocation) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Cargando mapa...
      </div>
    );
  }

  // ========== RENDER ==========
  return (
    <>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        style={{ height: '100vh', width: '100vw' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker position={userLocation} />

        <PiaggioMarkers
          piaggios={piaggios}
          userLocation={userLocation}
          onPiaggioClick={(piaggio) => {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              piaggio.coordenadas[0],
              piaggio.coordenadas[1]
            );

            const price = 2000 + distance * 800;
            const duration = (distance / 30) * 60;

            openConfirmModal(piaggio, distance, duration, price);
          }}
          onToggleFavorite={handleToggleFavorite}
          favoriteId={favoriteId}
          routeInfo={routeInfo}
          isCalculating={isCalculating}
        />

        <MapController onMapReady={setMapInstance} />
      </MapContainer>

      <PiaggioPanel
        piaggios={piaggios}
        userLocation={userLocation}
        onSelectPiaggio={handlePiaggioSelect}
        lastUpdate={lastUpdate}
      />

      {/* PANEL INFERIOR */}
      {routeInfo && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '16px',
          right: '16px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '16px',
          padding: '12px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <div>
            <div>Viaje estimado</div>
            <div>
              {routeInfo.distanceFormatted} • {routeInfo.durationFormatted}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={clearRoute}>🗺️ Limpiar</button>
          </div>
        </div>
      )}

      {/* MODAL */}
      <ConfirmTripModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleRequestTrip}
        tripDetails={selectedTripDetails}
        isConfirming={tripLoading}
      />

      {/* NOTIFICACIÓN */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#000',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '20px',
          zIndex: 2000
        }}>
          {notificationMessage}
        </div>
      )}
    </>
  );
};