// src/services/verificationService.js
// Servicios para verificación de conductores

import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

const VERIFICATION_COLLECTION = 'driverVerifications';

// Subir documento a Storage
export const uploadDocument = async (userId, documentType, file) => {
  try {
    const fileRef = ref(storage, `drivers/${userId}/${documentType}_${Date.now()}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    return { success: true, url };
  } catch (error) {
    console.error('Error subiendo documento:', error);
    return { success: false, error: error.message };
  }
};

// Crear solicitud de verificación
export const createVerificationRequest = async (userId, data) => {
  try {
    await setDoc(doc(db, VERIFICATION_COLLECTION, userId), {
      userId: userId,
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      placa: data.placa,
      cedula: data.cedula,
      cedulaFrontUrl: data.cedulaFrontUrl,
      cedulaBackUrl: data.cedulaBackUrl,
      licenciaUrl: data.licenciaUrl,
      soatUrl: data.soatUrl,
      vehiculoUrl: data.vehiculoUrl,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Actualizar el rol del usuario en la colección users
    await setDoc(doc(db, 'users', userId), {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      role: 'conductor_pendiente', // Rol especial hasta verificar
      placa: data.placa,
      verified: false,
      createdAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error creando solicitud:', error);
    return { success: false, error: error.message };
  }
};

// Obtener conductores pendientes (para admin)
export const getPendingDrivers = async () => {
  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where('verified', '==', false),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: drivers };
  } catch (error) {
    console.error('Error obteniendo conductores pendientes:', error);
    return { success: false, error: error.message };
  }
};

// Aprobar conductor
export const approveDriver = async (userId) => {
  try {
    // Actualizar verificación
    await updateDoc(doc(db, VERIFICATION_COLLECTION, userId), {
      verified: true,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Actualizar rol del usuario a conductor activo
    await updateDoc(doc(db, 'users', userId), {
      role: 'conductor',
      verified: true,
      verifiedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error aprobando conductor:', error);
    return { success: false, error: error.message };
  }
};

// Rechazar conductor
export const rejectDriver = async (userId, reason) => {
  try {
    await updateDoc(doc(db, VERIFICATION_COLLECTION, userId), {
      verified: false,
      rejected: true,
      rejectionReason: reason,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Actualizar rol a rechazado
    await updateDoc(doc(db, 'users', userId), {
      role: 'conductor_rechazado',
      verified: false,
      rejectionReason: reason
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rechazando conductor:', error);
    return { success: false, error: error.message };
  }
};

// Verificar estado de verificación del conductor
export const getDriverVerificationStatus = async (userId) => {
  try {
    const docRef = doc(db, VERIFICATION_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: true, data: { verified: false, exists: false } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener conductores ya verificados (historial)
export const getVerifiedDrivers = async () => {
  try {
    const q = query(
      collection(db, VERIFICATION_COLLECTION),
      where('verified', '==', true),
      orderBy('approvedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const drivers = [];
    snapshot.forEach((doc) => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: drivers };
  } catch (error) {
    return { success: false, error: error.message };
  }
};