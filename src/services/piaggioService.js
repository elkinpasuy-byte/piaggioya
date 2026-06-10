// src/services/piaggioService.js
// Servicio para manejar Piaggios en Firestore

import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'piaggios';

// Actualizar estado de un Piaggio
export const updatePiaggioStatus = async (piaggioId, newStatus) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, piaggioId);
    await updateDoc(docRef, {
      estado: newStatus,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error actualizando Piaggio:', error);
    return { success: false, error: error.message };
  }
};

// Obtener un Piaggio por ID
export const getPiaggioById = async (piaggioId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, piaggioId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Piaggio no encontrado' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};