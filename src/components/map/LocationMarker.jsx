import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Icono personalizado para ubicación actual
const userIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const LocationMarker = ({ position }) => {
  const map = useMap();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    if (position && map && isFirstLoad) {
      map.setView([position.lat, position.lng], 15);
      setIsFirstLoad(false);
    }
  }, [position, map, isFirstLoad]);

  if (!position) return null;

  return (
    <Marker 
      position={[position.lat, position.lng]} 
      icon={userIcon}
      zIndexOffset={1000}
    >
      <Popup>
        <div style={{ textAlign: 'center', minWidth: '150px' }}>
          <strong>📍 Tu ubicación</strong><br />
          <span style={{ fontSize: '12px', color: '#666' }}>
            Pasto, Colombia
          </span>
        </div>
      </Popup>
    </Marker>
  );
};