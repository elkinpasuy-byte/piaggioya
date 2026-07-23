// src/services/shipmentService.js
// Punto de entrada unificado para todos los servicios de envíos
// Re-exporta todas las funciones desde los módulos especializados

export * from './shipmentCrud';
export * from './driverService';
export * from './ratingService';
export * from './priceService';
// Las nuevas funciones ya están en shipmentCrud, así que se exportan automáticamente