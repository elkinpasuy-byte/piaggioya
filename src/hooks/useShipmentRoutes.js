// src/hooks/useShipmentRoutes.js
// Maneja rutas múltiples: conductor → recogida → entrega

import { useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';

export const useShipmentRoutes = (map) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [showPickupRoute, setShowPickupRoute] = useState(true);
  const [showDeliveryRoute, setShowDeliveryRoute] = useState(false);
  const routingControlRef = useRef(null);

  const clearRoutes = useCallback(() => {
    if (routingControlRef.current) {
      map?.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
  }, [map]);

  // Ruta 1: Conductor → Recogida
  const calculatePickupRoute = useCallback((driverLatLng, pickupLatLng) => {
    clearRoutes();
    
    if (!map || !driverLatLng || !pickupLatLng) return;

    const routing = L.Routing.control({
      waypoints: [
        L.latLng(driverLatLng.lat, driverLatLng.lng),
        L.latLng(pickupLatLng.lat, pickupLatLng.lng)
      ],
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      lineOptions: {
        styles: [{ color: '#007bff', weight: 5, opacity: 0.9 }]
      }
    }).addTo(map);

    routingControlRef.current = routing;

    routing.on('routesfound', (e) => {
      const route = e.routes[0];
      const distanceKm = route.summary.totalDistance / 1000;
      const durationMin = route.summary.totalTime / 60;
      
      setRouteInfo({
        distanceToPickup: distanceKm,
        distanceToPickupFormatted: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`,
        timeToPickup: durationMin,
        timeToPickupFormatted: durationMin < 1 ? '< 1 min' : `${Math.round(durationMin)} min`
      });
      
      setShowPickupRoute(true);
    });
  }, [map, clearRoutes]);

  // Ruta 2: Recogida → Entrega
  const calculateDeliveryRoute = useCallback((pickupLatLng, deliveryLatLng) => {
    clearRoutes();
    
    if (!map || !pickupLatLng || !deliveryLatLng) return;

    const routing = L.Routing.control({
      waypoints: [
        L.latLng(pickupLatLng.lat, pickupLatLng.lng),
        L.latLng(deliveryLatLng.lat, deliveryLatLng.lng)
      ],
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      lineOptions: {
        styles: [{ color: '#28a745', weight: 5, opacity: 0.9 }]
      }
    }).addTo(map);

    routingControlRef.current = routing;

    routing.on('routesfound', (e) => {
      const route = e.routes[0];
      const distanceKm = route.summary.totalDistance / 1000;
      const durationMin = route.summary.totalTime / 60;
      
      setRouteInfo(prev => ({
        ...prev,
        distanceToDelivery: distanceKm,
        distanceToDeliveryFormatted: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`,
        timeToDelivery: durationMin,
        timeToDeliveryFormatted: durationMin < 1 ? '< 1 min' : `${Math.round(durationMin)} min`
      }));
      
      setShowPickupRoute(false);
      setShowDeliveryRoute(true);
    });
  }, [map, clearRoutes]);

  return {
    routeInfo,
    showPickupRoute,
    showDeliveryRoute,
    calculatePickupRoute,
    calculateDeliveryRoute,
    clearRoutes
  };
};