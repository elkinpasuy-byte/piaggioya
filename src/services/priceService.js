import { db } from '../firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'shipments';

// ============================================================
//  PROPUESTA DE PRECIO (CONDUCTOR)
// ============================================================

export const proposePrice = async (shipmentId, proposedPrice) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      proposedPrice,
      proposedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error proponiendo precio:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  ACEPTAR / RECHAZAR PROPUESTA (CLIENTE)
// ============================================================

export const acceptPriceProposal = async (shipmentId, agreedPrice) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { success: false, error: 'Envío no encontrado' };
    }
    const data = snap.data();
    const price = agreedPrice || data.proposedPrice;
    if (!price || price <= 0) {
      return { success: false, error: 'No hay una propuesta de precio válida' };
    }
 await updateDoc(docRef, {
  agreedPrice: price,
  proposedPrice: null,
  priceAgreedAt: Timestamp.now(),
  status: 'accepted', // ← DEBE SER 'accepted' solo cuando el precio está acordado
  updatedAt: Timestamp.now()
});
    return { success: true };
  } catch (error) {
    console.error('Error aceptando propuesta:', error);
    return { success: false, error: error.message };
  }
};

export const rejectPriceProposal = async (shipmentId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      proposedPrice: null,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error rechazando propuesta:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
//  ACORDAR PRECIO DIRECTAMENTE
// ============================================================

export const agreePrice = async (shipmentId, agreedPrice) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, shipmentId);
    await updateDoc(docRef, {
      agreedPrice,
      proposedPrice: null,
      priceAgreedAt: Timestamp.now(),
      status: 'accepted', // o 'in_progress' según flujo
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error acordando precio:', error);
    return { success: false, error: error.message };
  }
};