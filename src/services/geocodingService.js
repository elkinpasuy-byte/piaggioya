// src/services/geocodingService.js
// Servicio para convertir direcciones a coordenadas usando OpenStreetMap Nominatim (gratis)

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Convierte una dirección a coordenadas (lat, lng)
 * @param {string} address - Dirección (ej: "Calle 123, Pasto")
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const geocodeAddress = async (address) => {
  if (!address || address.trim() === '') {
    return null;
  }

  try {
    const response = await fetch(
      `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocodificando dirección:', error);
    return null;
  }
};

/**
 * Convierte múltiples direcciones a coordenadas
 * @param {string} pickupAddress - Dirección de recogida
 * @param {string} deliveryAddress - Dirección de entrega
 * @returns {Promise<{pickupCoords: {lat, lng}, deliveryCoords: {lat, lng}}>}
 */
export const geocodeShipmentAddresses = async (pickupAddress, deliveryAddress) => {
  // Geocodificar ambas direcciones en paralelo
  const [pickupCoords, deliveryCoords] = await Promise.all([
    geocodeAddress(pickupAddress),
    geocodeAddress(deliveryAddress)
  ]);

  return {
    pickupCoords,
    deliveryCoords
  };
};