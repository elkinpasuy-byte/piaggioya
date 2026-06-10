  // src/services/tripService.js

  import { db } from '../firebase';

  import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDoc,
    query,
    where,
    getDocs,
    orderBy,
    Timestamp,
    onSnapshot  // ← AGREGAR ESTO
  } from 'firebase/firestore';

 
  const COLLECTION_NAME = 'shipments';

  // ====================================
  // Crear viaje
  // ====================================
  export const createTrip = async (tripData) => {
    try {
      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        {
          ...tripData,
          status: 'pending',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );

      return {
        success: true,
        id: docRef.id
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Obtener viaje por ID
  // ====================================
  export const getTripById = async (tripId) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, tripId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Viaje no encontrado'
        };
      }

      return {
        success: true,
        data: {
          id: docSnap.id,
          ...docSnap.data()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Actualizar estado
  // ====================================
  export const updateTripStatus = async (
    tripId,
    status,
    additionalData = {}
  ) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, tripId);

      await updateDoc(docRef, {
        status,
        ...additionalData,
        updatedAt: Timestamp.now()
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Viajes del cliente (HISTORIAL)
  // ====================================
  export const getClientTrips = async (clientId) => {
    try {
      if (!clientId) {
        return { success: false, error: 'Email de cliente no proporcionado' };
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const trips = [];

      querySnapshot.forEach((docItem) => {
        trips.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      return {
        success: true,
        data: trips
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Viajes pendientes (para conductores)
  // ====================================
 export const getAllTrips = async () => {
  try {

    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const trips = [];

    querySnapshot.forEach((docItem) => {
      trips.push({
        id: docItem.id,
        ...docItem.data()
      });
    });

    return {
      success: true,
      data: trips
    };

  } catch (error) {

    return {
      success: false,
      error: error.message
    };

  }
};

  // ====================================
  // Aceptar viaje (conductor)
  // ====================================
  export const acceptTrip = async (
    tripId,
    driverId,
    driverName,
    driverPhone
  ) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, tripId);

      await updateDoc(docRef, {
        status: 'accepted',
        driverId,
        driverName,
        driverPhone,
        acceptedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Viajes activos del conductor
  // ====================================
  export const getDriverActiveTrips = async (driverId) => {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('driverId', '==', driverId),
        where('status', 'in', ['accepted', 'in_progress']),
        orderBy('acceptedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const trips = [];

      querySnapshot.forEach((docItem) => {
        trips.push({
          id: docItem.id,
          ...docItem.data()
        });
      });

      return {
        success: true,
        data: trips
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  // ====================================
  // Historial de viajes del conductor
  // ====================================
  export const getDriverTripsHistory = async (driverEmail) => {
    try {
      if (!driverEmail) {
        return { success: false, error: 'Email de conductor no proporcionado' };
      }

      const q = query(
        collection(db, COLLECTION_NAME),
        where('driverId', '==', driverEmail),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const trips = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: trips };
    } catch (error) {
      console.error('Error obteniendo historial del conductor:', error);
      return { success: false, error: error.message };
    }
  };

  // ====================================
  // Viajes por estado específico
  // ====================================
  export const getTripsByStatus = async (email, role, status) => {
    try {
      if (!email || !role || !status) {
        return { success: false, error: 'Faltan parámetros requeridos' };
      }

      const fieldName = role === 'cliente' ? 'clientId' : 'driverId';
      
      const q = query(
        collection(db, COLLECTION_NAME),
        where(fieldName, '==', email),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const trips = [];
      querySnapshot.forEach((doc) => {
        trips.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: trips };
    } catch (error) {
      console.error('Error obteniendo viajes por estado:', error);
      return { success: false, error: error.message };
    }
  };
  // ==================== SEGUIMIENTO EN TIEMPO REAL ====================

  /**
   * Actualizar ubicación del conductor en tiempo real
   * @param {string} tripId - ID del viaje
   * @param {number} lat - Latitud
   * @param {number} lng - Longitud
   */
  export const updateDriverLocation = async (tripId, lat, lng) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, tripId);
      await updateDoc(docRef, {
        driverLocation: {
          lat,
          lng,
          updatedAt: Timestamp.now()
        },
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error actualizando ubicación:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Escuchar cambios en tiempo real de un viaje
   * @param {string} tripId - ID del viaje
   * @param {function} callback - Función que se ejecuta cuando hay cambios
   */
  export const listenToTrip = (tripId, callback) => {
    const docRef = doc(db, COLLECTION_NAME, tripId);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      }
    });
  };

  // ==================== CALIFICACIÓN DE VIAJES ====================

  /**
   * Calificar un viaje completado
   * @param {string} tripId - ID del viaje
   * @param {number} stars - Calificación (1-5)
   * @param {string} comment - Comentario opcional
   */
  export const rateTrip = async (tripId, stars, comment = '') => {
    try {
      const docRef = doc(db, COLLECTION_NAME, tripId);
      await updateDoc(docRef, {
        driverRating: {
          stars,
          comment,
          ratedAt: Timestamp.now()
        },
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      console.error('Error calificando viaje:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Actualizar calificación promedio del conductor
   * @param {string} driverEmail - Email del conductor
   */
  export const updateDriverAverageRating = async (driverEmail) => {
    try {
      // Obtener todas las calificaciones del conductor
      const q = query(
        collection(db, COLLECTION_NAME),
        where('driverId', '==', driverEmail),
        where('driverRating.stars', '!=', null)
      );
      
      const querySnapshot = await getDocs(q);
      let totalStars = 0;
      let ratingCount = 0;
      
      querySnapshot.forEach((doc) => {
        const stars = doc.data().driverRating?.stars;
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
      console.error('Error actualizando promedio:', error);
      return { success: false, error: error.message };
    }
  };