// src/services/shipmentCrud.js
import { db } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'shipments';

// ============================================================
//  CREACIÓN Y OBTENCIÓN BÁSICA
// ============================================================

export const createShipment = async (shipmentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...shipmentData,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creando envío:', error);
    return { success: false, error: error.message };
  }
};

export const getShipmentById = async (shipmentId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Envío no encontrado' };
  } catch (error) {
    console.error('Error obteniendo envío:', error);
    return { success: false, error: error.message };
  }
};

export const getPendingShipments = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: shipments };
  } catch (error) {
    console.error('Error obteniendo envíos pendientes:', error);
    return { success: false, error: error.message };
  }
};

export const getClientShipments = async (clientId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const shipments = [];
    querySnapshot.forEach((doc) => {
      shipments.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: shipments };
  } catch (error) {
    console.error('Error obteniendo envíos del cliente:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  ACTUALIZACIÓN DE ESTADO Y ASIGNACIÓN
// ============================================================

export const updateShipmentStatus = async (shipmentId, status, additionalData = {}) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      status,
      ...additionalData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error actualizando envío:', error);
    return { success: false, error: error.message };
  }
};

export const acceptShipment = async (shipmentId, driverId, driverName, driverPhone) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      status: 'accepted',
      driverId,
      driverName,
      driverPhone,
      acceptedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error aceptando envío:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  GESTIÓN DE OFERTAS MÚLTIPLES
// ============================================================

/**
 * Hacer una oferta en un envío (conductor)
 * @param {string} shipmentId - ID del envío
 * @param {object} offerData - { driverId, driverName, driverPhone, proposedPrice, notes? }
 */
export const makeOffer = async (shipmentId, offerData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: 'Envío no encontrado' };
    }
    
    const data = docSnap.data();
    // Si el envío ya tiene conductor asignado, no se pueden hacer ofertas
    if (data.status !== 'pending' && data.status !== 'bidding') {
      return { success: false, error: 'Este envío ya no acepta ofertas' };
    }
    
    // Crear objeto de oferta
    const offer = {
      ...offerData,
      offerId: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Timestamp.now(),
      status: 'pending' // pending | accepted | rejected
    };
    
    // Si el envío no tiene array de ofertas, crearlo
    const currentOffers = data.offers || [];
    
    // Verificar si el conductor ya hizo una oferta (evitar duplicados)
    const existingOfferIndex = currentOffers.findIndex(o => o.driverId === offerData.driverId);
    if (existingOfferIndex !== -1) {
      // Actualizar oferta existente
      currentOffers[existingOfferIndex] = offer;
    } else {
      // Agregar nueva oferta
      currentOffers.push(offer);
    }
    
    await updateDoc(docRef, {
      offers: currentOffers,
      status: data.status === 'pending' ? 'bidding' : data.status,
      updatedAt: Timestamp.now()
    });
    
    return { success: true, offerId: offer.offerId };
  } catch (error) {
    console.error('Error haciendo oferta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Obtener todas las ofertas de un envío
 * @param {string} shipmentId
 */
export const getShipmentOffers = async (shipmentId) => {
  try {
    const result = await getShipmentById(shipmentId);
    if (!result.success) return result;
    return { success: true, data: result.data.offers || [] };
  } catch (error) {
    console.error('Error obteniendo ofertas:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Aceptar una oferta (cliente)
 * @param {string} shipmentId
 * @param {string} offerId - ID de la oferta a aceptar
 */
export const acceptOffer = async (shipmentId, offerId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: 'Envío no encontrado' };
    }
    
    const data = docSnap.data();
    const offers = data.offers || [];
    const offerIndex = offers.findIndex(o => o.offerId === offerId);
    
    if (offerIndex === -1) {
      return { success: false, error: 'Oferta no encontrada' };
    }
    
    const acceptedOffer = offers[offerIndex];
    
    // Actualizar todas las ofertas: marcar la seleccionada como accepted, las demás como rejected
    const updatedOffers = offers.map(o => ({
      ...o,
      status: o.offerId === offerId ? 'accepted' : 'rejected'
    }));
    
    await updateDoc(docRef, {
      offers: updatedOffers,
      status: 'assigned', // ← Conductor asignado, precio pendiente
      driverId: acceptedOffer.driverId,
      driverName: acceptedOffer.driverName,
      driverPhone: acceptedOffer.driverPhone,
      acceptedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    return { success: true, driver: { id: acceptedOffer.driverId, name: acceptedOffer.driverName } };
  } catch (error) {
    console.error('Error aceptando oferta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Rechazar una oferta (cliente) - elimina la oferta del array
 * @param {string} shipmentId
 * @param {string} offerId
 */
export const rejectOffer = async (shipmentId, offerId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: 'Envío no encontrado' };
    }
    
    const data = docSnap.data();
    const offers = data.offers || [];
    const filteredOffers = offers.filter(o => o.offerId !== offerId);
    
    // Si no quedan ofertas, volver a pending
    const newStatus = filteredOffers.length === 0 ? 'pending' : 'bidding';
    
    await updateDoc(docRef, {
      offers: filteredOffers,
      status: newStatus,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rechazando oferta:', error);
    return { success: false, error: error.message };
  }
};