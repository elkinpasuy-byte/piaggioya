import { useCallback } from 'react';

export const useDistanceCalculator = () => {
  // Fórmula de Haversine para distancia en km
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio terrestre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Calcular tiempo estimado (velocidad promedio 30 km/h en ciudad)
  const calculateEstimatedTime = useCallback((distanceKm) => {
    const avgSpeed = 30; // km/h en ciudad
    const timeHours = distanceKm / avgSpeed;
    const minutes = Math.round(timeHours * 60);
    
    if (minutes < 1) return '< 1 minuto';
    if (minutes === 1) return '1 minuto';
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }, []);

  // Calcular precio estimado (base $2000 + $500 por km)
  const calculateEstimatedPrice = useCallback((distanceKm) => {
    const basePrice = 2000;
    const pricePerKm = 500;
    const total = basePrice + (distanceKm * pricePerKm);
    return Math.round(total);
  }, []);

  return {
    calculateDistance,
    calculateEstimatedTime,
    calculateEstimatedPrice
  };
};