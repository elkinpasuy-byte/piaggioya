import { db } from '../firebase';
import {
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  collection,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'shipments';

// ============================================================
//  UBICACIÓN DEL CONDUCTOR
// ============================================================

export const updateDriverLocation = async (shipmentId, lat, lng) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      driverLocation: { lat, lng, updatedAt: Timestamp.now() }
    });
    return { success: true };
  } catch (error) {
    console.warn('⚠️ Error enviando ubicación:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  HISTORIAL DEL CONDUCTOR
// ============================================================

export const getDriverShipmentsHistory = async (driverId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('driverId', '==', driverId)
    );
    const querySnapshot = await getDocs(q);
    const shipments = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: shipments };
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  CALIFICACIONES PROMEDIO Y NIVEL
// ============================================================

export const getDriverAverageRating = async (driverId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('driverId', '==', driverId),
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

export const updateDriverAverageRating = async (driverId) => {
  try {
    if (!driverId) {
      return { success: false, error: 'ID de conductor no proporcionado' };
    }
    const result = await getDriverAverageRating(driverId);
    if (!result.success) return result;

    const userRef = doc(db, 'users', driverId);
    await updateDoc(userRef, {
      averageRating: result.average,
      totalRatings: result.total
    });
    return { success: true, averageRating: result.average, totalRatings: result.total };
  } catch (error) {
    console.error('Error actualizando promedio del conductor:', error);
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