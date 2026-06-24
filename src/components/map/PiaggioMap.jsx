// ========== IMPORTS ==========
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// COMPONENTES
import { LocationMarker } from './LocationMarker';
import { PiaggioMarkers } from './PiaggioMarkers';
//import { PiaggioPanel } from '../PiaggioPanel/PiaggioPanel';
import { ConfirmTripModal } from '../modals/ConfirmTripModal';
import { MapController } from './MapController'; // ⚠️ asegúrate que exista

// HOOKS

import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useRoute } from '../../hooks/useRoute';
import { useAuth } from '../../contexts/AuthContext';

// SERVICES
import { createShipment, getShipmentById } from '../../services/shipmentService';

// ICONOS LEAFLET
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ========== COMPONENTE ==========
export const PiaggioMap = ({ userLocation, onMapReady }) => {
  const mapRef = useRef(null);
  const location = useLocation();

  const [conductores, setConductores] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const [favoriteId, setFavoriteId] = useLocalStorage('piaggiaya_favorite', null);

 
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationTimeoutRef = useRef(null);
  const [selectedPiaggio, setSelectedPiaggio] = useState(null);

  const [mapInstance, setMapInstance] = useState(null);
  const { routeInfo, isCalculating, calculateRoute, clearRoute } =
    useRoute(mapInstance);

  const { userData } = useAuth();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

  const handleMapReady = (map) => {mapRef.current = map;setMapInstance(map);if (onMapReady) onMapReady(map);};

  // ===== LOAD SHIPMENT (arreglado) =====
  useEffect(() => {
  const loadConductores = async () => {
    try {
      const q = query(collection(db, 'users'),where('role', '==', 'conductor'),where('isOnline', '==', true));
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setConductores(list);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error('Error cargando conductores:', error);
    }
  };
  loadConductores();
}, []);

  // ===== DISTANCIA =====
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };
// ===== SELECCIÓN PIAGGIO =====
const handlePiaggioSelect = useCallback(
  (piaggio) => {
    if (piaggio.estado !== 'disponible') return;

    if (mapInstance && userLocation) {
      calculateRoute(userLocation, piaggio.coordenadas);
    }

    setSelectedPiaggio(piaggio);
  },
  [mapInstance, userLocation, calculateRoute]
);

// ===== FAVORITOS =====
const handleToggleFavorite = useCallback((piaggioId) => {
  if (favoriteId === piaggioId) {
    setFavoriteId(null);
    setNotificationMessage('⭐ Eliminado de favoritos');
  } else {
    setFavoriteId(piaggioId);
    setNotificationMessage('⭐ Agregado a favoritos');
  }

  setShowNotification(true);
  setTimeout(() => setShowNotification(false), 2000);
}, [favoriteId, setFavoriteId]);

// ===== RENDER =====
if (!userLocation) {
  return <div>Cargando mapa...</div>;
}
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
        conductores={conductores}
        userLocation={userLocation}
        onPiaggioClick={handlePiaggioSelect}
        //onToggleFavorite={handleToggleFavorite}
        onToggleFavorite={(id) => setFavoriteId(id)}
        favoriteId={favoriteId}
        routeInfo={routeInfo}
        isCalculating={isCalculating}
      />

        <MapController onMapReady={handleMapReady} />
      </MapContainer>

  {/* Solo mostrar el panel de Piaggios si es cliente */}


      {/* MODAL */}
      <ConfirmTripModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        tripDetails={selectedTripDetails}
      />
    </>
  );
};