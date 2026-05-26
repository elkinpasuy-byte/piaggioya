// ========== IMPORTS EXISTENTES (se mantienen) ==========
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useCallback, useRef, useEffect } from 'react';

// ========== IMPORTS DE COMPONENTES EXISTENTES ==========
import { LocationMarker } from './LocationMarker';
import { PiaggioMarkers } from './PiaggioMarkers';
import { PiaggioPanel } from '../PiaggioPanel/PiaggioPanel';

// ========== IMPORTS DE HOOKS EXISTENTES ==========
import { useRealTimePiaggios } from '../../hooks/useRealTimePiaggios';
import { useLocalStorage } from '../../hooks/useLocalStorage';

// ========== NUEVO IMPORT PARA RUTAS ==========
import { useRoute } from '../../hooks/useRoute';

// ========== CONFIGURACIÓN DE ICONOS LEAFLET (EXISTENTE) ==========
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ========== COMPONENTE MapController (FUERA de PiaggioMap) ==========
// Este componente obtiene la instancia del mapa y la pasa al padre
const MapController = ({ onMapReady }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  
  return null;
};

// ========== COMPONENTE PRINCIPAL PiaggioMap ==========
export const PiaggioMap = ({ userLocation }) => {
  // ========== HOOKS EXISTENTES ==========
  const { piaggios, lastUpdate } = useRealTimePiaggios(userLocation, 4000);
  const [favoriteId, setFavoriteId] = useLocalStorage('piaggiaya_favorite', null);
  
  // ========== ESTADOS EXISTENTES ==========
  const [selectedPiaggio, setSelectedPiaggio] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const notificationTimeoutRef = useRef(null);
  
  // ========== NUEVOS ESTADOS PARA RUTAS ==========
  const [mapInstance, setMapInstance] = useState(null);
  const { routeInfo, isCalculating, calculateRoute, clearRoute } = useRoute(mapInstance);
  
  // ========== FUNCIÓN EXISTENTE: Seleccionar Piaggio ==========
  const handlePiaggioSelect = useCallback((piaggio) => {
    // Validar disponibilidad
    if (piaggio.estado !== 'disponible') {
      setNotificationMessage(`❌ ${piaggio.nombre} no está disponible`);
      setShowNotification(true);
      if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = setTimeout(() => setShowNotification(false), 3000);
      return;
    }
    
    // ========== NUEVO: Calcular ruta al Piaggio seleccionado ==========
    if (mapInstance && userLocation && piaggio.coordenadas) {
      calculateRoute(
        { lat: userLocation.lat, lng: userLocation.lng },
        piaggio.coordenadas
      );
    }
    
    // Mostrar selección (existente)
    setSelectedPiaggio(piaggio);
    setNotificationMessage(`✅ Seleccionaste a ${piaggio.nombre} - ${piaggio.placa}`);
    setShowNotification(true);
    
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => {
      setShowNotification(false);
      setSelectedPiaggio(null);
    }, 3000);
  }, [mapInstance, userLocation, calculateRoute]);
  
  // ========== NUEVA FUNCIÓN: Limpiar ruta ==========
  const handleClearRoute = useCallback(() => {
    clearRoute();
  }, [clearRoute]);
  
  // ========== NUEVA FUNCIÓN: Toggle favorito ==========
  const handleToggleFavorite = useCallback((piaggioId) => {
    if (favoriteId === piaggioId) {
      setFavoriteId(null);
      setNotificationMessage(`⭐ Favorito eliminado`);
    } else {
      setFavoriteId(piaggioId);
      const piaggio = piaggios.find(p => p.id === piaggioId);
      setNotificationMessage(`⭐ ${piaggio?.nombre} agregado a favoritos`);
    }
    setShowNotification(true);
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setShowNotification(false), 2000);
  }, [favoriteId, setFavoriteId, piaggios]);
  
  // ========== RENDER: Pantalla de carga ==========
  if (!userLocation) {
    return (
      <div className="map-loading">
        <div className="spinner-small"></div>
        <p>Cargando mapa...</p>
      </div>
    );
  }
  
  // ========== RENDER: Mapa y componentes ==========
  return (
    <>
      {/* MapContainer - EXISTENTE */}
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={14}
        style={{ height: "100vh", width: "100vw" }}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Capa de mapa - EXISTENTE */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marcador de ubicación - EXISTENTE */}
        <LocationMarker position={userLocation} />
        
        {/* Marcadores de Piaggios - EXISTENTE (con nueva prop favoriteId) */}
      <PiaggioMarkers 
        piaggios={piaggios}
        userLocation={userLocation}
        onPiaggioClick={handlePiaggioSelect}
        onToggleFavorite={handleToggleFavorite}
        favoriteId={favoriteId}
        routeInfo={routeInfo}
        isCalculating={isCalculating}
        />
        
        {/* Controlador de mapa - NUEVO (para obtener instancia) */}
        <MapController onMapReady={setMapInstance} />
      </MapContainer>
      
      {/* Panel lateral - EXISTENTE (con nueva prop lastUpdate) */}
      <PiaggioPanel 
  piaggios={piaggios}
  userLocation={userLocation}
  onSelectPiaggio={handlePiaggioSelect}
  lastUpdate={lastUpdate}
/>
      
      {/* Botón limpiar ruta - NUEVO */}
      {routeInfo && (
        <button className="clear-route-btn" onClick={handleClearRoute}>
          🗺️ Limpiar ruta ({routeInfo.distanceFormatted})
        </button>
      )}

     {routeInfo && (
  <>
    <button className="clear-route-btn" onClick={handleClearRoute}>
      🗺️ Limpiar ruta ({routeInfo.distanceFormatted})
    </button>
    <button 
      className="share-whatsapp-btn"
      onClick={() => {
        const message = `🛵 PiaggioYa - Viaje estimado\n📏 Distancia: ${routeInfo.distanceFormatted}\n⏱️ Tiempo: ${routeInfo.durationFormatted}\n📍 Mi ubicación: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }}
    >
      📱 Compartir viaje
    </button>
  </>
)}
      
      {/* Notificación toast - EXISTENTE */}
      {showNotification && (
        <div className="notification-toast">
          <div className="notification-content">
            {notificationMessage}
          </div>
        </div>
      )}
    </>
  );
};