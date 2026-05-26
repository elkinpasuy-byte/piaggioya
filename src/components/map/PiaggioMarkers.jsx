import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { memo, useMemo } from 'react';
import { PiaggioPopup } from '../PiaggioCard/PiaggioPopup';

const iconCache = new Map();

const getPiaggioIcon = (estado, isFavorite) => {
  const cacheKey = `${estado}-${isFavorite}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }
  
  let iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png';
  let shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png';
  
  if (isFavorite) {
    iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png';
  } else {
    switch(estado) {
      case 'disponible':
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png';
        break;
      case 'ocupado':
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png';
        break;
      case 'mantenimiento':
        iconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png';
        break;
    }
  }
  
  const icon = L.icon({
    iconUrl: iconUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  iconCache.set(cacheKey, icon);
  return icon;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const PiaggioMarker = memo(({ 
  piaggio, 
  userLocation, 
  onPiaggioClick, 
  onToggleFavorite, 
  isFavorite,
  routeInfo,
  isCalculating
}) => {
  const icon = useMemo(() => getPiaggioIcon(piaggio.estado, isFavorite), [piaggio.estado, isFavorite]);
  const position = useMemo(() => [piaggio.coordenadas[0], piaggio.coordenadas[1]], [piaggio.coordenadas]);
  
  const distance = userLocation ? calculateDistance(
    userLocation.lat,
    userLocation.lng,
    piaggio.coordenadas[0],
    piaggio.coordenadas[1]
  ) : null;
  
  const piaggioWithDistance = {
    ...piaggio,
    distance
  };
  
  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{
        click: () => onPiaggioClick?.(piaggioWithDistance)
      }}
    >
      <Popup>
        <PiaggioPopup 
          piaggio={piaggioWithDistance}
          onSelect={onPiaggioClick}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite}
          routeInfo={routeInfo}
          isCalculating={isCalculating}
        />
      </Popup>
    </Marker>
  );
});

PiaggioMarker.displayName = 'PiaggioMarker';

export const PiaggioMarkers = memo(({ 
  piaggios, 
  userLocation, 
  onPiaggioClick, 
  onToggleFavorite, 
  favoriteId,
  routeInfo,
  isCalculating
}) => {
  if (!piaggios || piaggios.length === 0) return null;
  
  return (
    <>
      {piaggios.map((piaggio) => (
        <PiaggioMarker
          key={piaggio.id}
          piaggio={piaggio}
          userLocation={userLocation}
          onPiaggioClick={onPiaggioClick}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoriteId === piaggio.id}
          routeInfo={routeInfo}
          isCalculating={isCalculating}
        />
      ))}
    </>
  );
});

PiaggioMarkers.displayName = 'PiaggioMarkers';