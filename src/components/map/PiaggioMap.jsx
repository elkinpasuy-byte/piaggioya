// ========== IMPORTS ==========
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// COMPONENTES
import { LocationMarker } from './LocationMarker';
import { PiaggioMarkers } from './PiaggioMarkers';
import { ConfirmTripModal } from '../modals/ConfirmTripModal';
import { MapController } from './MapController';

// FIREBASE
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

// HOOKS Y CONTEXTOS
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
  const { userData } = useAuth();

  // ===== ESTADOS LOCALES =====
  const [conductores, setConductores] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [selectedPiaggio, setSelectedPiaggio] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);
  
  // ===== FAVORITOS (reemplazando useLocalStorage) =====
  const [favoriteId, setFavoriteId] = useState(() => {
    try {
      return localStorage.getItem('piaggiaya_favorite') || null;
    } catch {
      return null;
    }
  });

  // Persistir favoritos en localStorage
  useEffect(() => {
    try {
      if (favoriteId) {
        localStorage.setItem('piaggiaya_favorite', favoriteId);
      } else {
        localStorage.removeItem('piaggiaya_favorite');
      }
    } catch (error) {
      console.warn('Error guardando favorito:', error);
    }
  }, [favoriteId]);

  // ===== RUTA (reemplazando useRoute) =====
  const routeLayerRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const calculateRoute = useCallback((startCoords, endCoords) => {
    if (!mapInstance) return;

    setIsCalculating(true);

    // Limpiar capa anterior
    if (routeLayerRef.current) {
      mapInstance.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    // Simular cálculo de ruta (línea recta)
    setTimeout(() => {
      try {
        const points = [
          [startCoords.lat, startCoords.lng],
          [endCoords.lat, endCoords.lng]
        ];

        const newLayer = L.polyline(points, {
          color: '#2563eb',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 6'
        }).addTo(mapInstance);

        routeLayerRef.current = newLayer;
        
        // Ajustar vista para mostrar toda la ruta
        mapInstance.fitBounds(points, { padding: [50, 50] });

        setRouteInfo({
          points,
          distance: calculateDistance(
            startCoords.lat, startCoords.lng,
            endCoords.lat, endCoords.lng
          )
        });
      } catch (error) {
        console.error('Error calculando ruta:', error);
      } finally {
        setIsCalculating(false);
      }
    }, 300);
  }, [mapInstance]);

  const clearRoute = useCallback(() => {
    if (routeLayerRef.current && mapInstance) {
      mapInstance.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    setRouteInfo(null);
    setSelectedPiaggio(null);
  }, [mapInstance]);

  // ===== CARGAR CONDUCTORES ONLINE =====
  useEffect(() => {
    const loadConductores = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'conductor'),
          where('isOnline', '==', true)
        );
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
    setFavoriteId(prev => prev === piaggioId ? null : piaggioId);
  }, []);

  // ===== MAP READY =====
  const handleMapReady = (map) => {
    mapRef.current = map;
    setMapInstance(map);
    if (onMapReady) onMapReady(map);
  };

  // ===== RENDER =====
  if (!userLocation) {
    return <div style={styles.loading}>Cargando mapa...</div>;
  }

  return (
    <>
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        className="piaggio-map"
        style={styles.map}
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
          onToggleFavorite={handleToggleFavorite}
          favoriteId={favoriteId}
          routeInfo={routeInfo}
          isCalculating={isCalculating}
        />

        <MapController onMapReady={handleMapReady} />
      </MapContainer>

      {/* MODAL */}
      <ConfirmTripModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        tripDetails={selectedTripDetails}
      />
    </>
  );
};

const styles = {
  map: {
    width: '100%',
    height: '100%',
    position: 'relative'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }
};