// src/components/map/MapController.jsx
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const MapController = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
};