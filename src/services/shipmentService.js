// src/services/shipmentService.js
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

// Crear envío
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

// Obtener envío por ID
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

// Actualizar estado de envío
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

// Obtener envíos pendientes (para conductores)
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

// Obtener envíos de un cliente
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

// ✅ FUNCIÓN QUE FALTABA
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

// Agregar esta función al final del archivo

export const rateShipment = async (shipmentId, stars, comment = '') => {
  try {
    const docRef = doc(db, 'shipments', shipmentId);
    await updateDoc(docRef, {
      rating: {
        stars,
        comment,
        ratedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error calificando envío:', error);
    return { success: false, error: error.message };
  }
};