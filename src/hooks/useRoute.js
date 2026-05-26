import { useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

export const useRoute = (map) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const routingControlRef = useRef(null);

  const clearRoute = useCallback(() => {
    if (routingControlRef.current) {
      try {
        map?.removeControl(routingControlRef.current);
      } catch (e) {
        console.warn('Error limpiando ruta:', e);
      }
      routingControlRef.current = null;
    }
    setRouteInfo(null);
    setIsCalculating(false);
  }, [map]);

  const calculateRoute = useCallback((startLatLng, endLatLng) => {
    if (!map || !startLatLng || !endLatLng) return;

    clearRoute();
    setIsCalculating(true);

    try {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(startLatLng.lat, startLatLng.lng),
          L.latLng(endLatLng[0], endLatLng[1])
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        collapsible: false,
        zoomToWaypoints: false,
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        lineOptions: {
          styles: [{ color: '#667eea', weight: 4, opacity: 0.8 }]
        }
      });

      routingControl.addTo(map);
      routingControlRef.current = routingControl;

      // Ocultar el panel de instrucciones inmediatamente
      setTimeout(() => {
        const container = document.querySelector('.leaflet-routing-container');
        if (container) container.style.display = 'none';
      }, 10);

      routingControl.on('routesfound', (e) => {
        const route = e.routes[0];
        const distanceKm = route.summary.totalDistance / 1000;
        const durationMin = route.summary.totalTime / 60;
        
        setRouteInfo({
          distance: distanceKm,
          distanceFormatted: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`,
          duration: durationMin,
          durationFormatted: durationMin < 1 ? '< 1 min' : `${Math.round(durationMin)} min`
        });
        setIsCalculating(false);
        
        // Volver a ocultar por si reaparece
        setTimeout(() => {
          const container = document.querySelector('.leaflet-routing-container');
          if (container) container.style.display = 'none';
        }, 50);
      });

      routingControl.on('routingerror', (e) => {
        console.error('Error calculando ruta:', e);
        setIsCalculating(false);
      });
    } catch (error) {
      console.error('Error creando ruta:', error);
      setIsCalculating(false);
    }
  }, [map, clearRoute]);

  return {
    routeInfo,
    isCalculating,
    calculateRoute,
    clearRoute
  };
};