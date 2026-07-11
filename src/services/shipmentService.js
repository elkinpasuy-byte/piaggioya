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

export const getDriverShipmentsHistory = async (driverId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('driverId', '==', driverId)
    );

    const querySnapshot = await getDocs(q);

    const shipments = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: shipments
    };
  } catch (error) {
    console.error('Error obteniendo historial:', error);

    return {
      success: false,
      error: error.message
    };
  }
};

// ==================== ACTUALIZAR CALIFICACIÓN PROMEDIO DEL CONDUCTOR ====================

export const updateDriverAverageRating = async (driverEmail) => {
  try {
    if (!driverEmail) {
      return { success: false, error: 'Email de conductor no proporcionado' };
    }

    // Obtener todas las calificaciones del conductor desde shipments
    const q = query(
      collection(db, 'shipments'),
      where('driverId', '==', driverEmail),
      where('rating.stars', '!=', null)
    );
    
    const querySnapshot = await getDocs(q);
    let totalStars = 0;
    let ratingCount = 0;
    
    querySnapshot.forEach((doc) => {
      const stars = doc.data().rating?.stars;
      if (stars) {
        totalStars += stars;
        ratingCount++;
      }
    });
    
    const averageRating = ratingCount > 0 ? totalStars / ratingCount : 0;
    
    // Actualizar el promedio en el documento del conductor (colección users)
    const userRef = doc(db, 'users', driverEmail);
    await updateDoc(userRef, {
      averageRating,
      totalRatings: ratingCount
    });
    
    return { success: true, averageRating, totalRatings: ratingCount };
  } catch (error) {
    console.error('Error actualizando promedio del conductor:', error);
    return { success: false, error: error.message };
  }
};

// ==================== NIVEL DEL CONDUCTOR ====================

/**
 * Obtener el nivel de un conductor basado en su promedio
 * @param {number} average - Promedio de calificación (0-5)
 * @returns {object} { label, emoji, color }
 */
export const getDriverAverageRating = async (driverEmail) => {
  try {
    const q = query(
      collection(db, 'shipments'),
      where('driverId', '==', driverEmail),
      where('rating.stars', '!=', null)
    );
    
    const querySnapshot = await getDocs(q);
    let totalStars = 0;
    let totalRatings = 0;
    
    querySnapshot.forEach((doc) => {
      const stars = doc.data().rating?.stars;
      if (stars) {
        totalStars += stars;
        totalRatings++;
      }
    });
    
    const average = totalRatings > 0 ? totalStars / totalRatings : 0;
    
    return {
      success: true,
      average: Math.round(average * 10) / 10,
      total: totalRatings
    };
  } catch (error) {
    console.error('Error obteniendo promedio:', error);
    return { success: false, error: error.message };
  }
};

export const getDriverLevel = (average) => {
  if (average >= 4.5) {
    return { label: 'Conductor Destacado', emoji: '🏆', color: '#4CAF50' };
  } else if (average >= 4.0) {
    return { label: 'Conductor Confiable', emoji: '✅', color: '#8BC34A' };
  } else if (average >= 3.0) {
    return { label: 'Conductor Regular', emoji: '⚠️', color: '#FF9800' };
  } else {
    return { label: 'Conductor en Evaluación', emoji: '🔍', color: '#F44336' };
  }
};

// Actualizar ubicación del conductor
export const updateDriverLocation = async (shipmentId, lat, lng) => {
  try {
    const docRef = doc(db, 'shipments', shipmentId);
    await updateDoc(docRef, {
      driverLocation: { lat, lng, updatedAt: new Date().toISOString() }
    });
  } catch (error) {
    console.warn('⚠️ Error enviando ubicación, reintentando...', error);
    setTimeout(() => {
      updateDriverLocation(shipmentId, lat, lng);
    }, 2000);
  }
};

