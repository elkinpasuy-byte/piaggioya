import { db } from '../firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'shipments';

// ============================================================
//  CALIFICACIÓN DE ENVÍOS
// ============================================================

export const rateShipment = async (shipmentId, stars, comment = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      rating: {
        stars,
        comment,
        ratedAt: Timestamp.now()
      },
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error calificando envío:', error);
    return { success: false, error: error.message };
  }
};