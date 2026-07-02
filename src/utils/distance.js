// src/utils/distance.js
// Calcula distancia en metros entre dos puntos (lat, lng) usando fórmula de Haversine
export const getDistanceInMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371e3; // Radio de la Tierra en metros
  const toRad = (angle) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};