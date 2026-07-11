// src/services/chatService.js
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';

const CHATS_COLLECTION = 'chats';

// Enviar un mensaje
export const sendMessage = async (shipmentId, senderId, senderName, message) => {
  try {
    await addDoc(collection(db, CHATS_COLLECTION), {
      shipmentId,
      senderId,
      senderName,
      message,
      timestamp: Timestamp.now(),
      read: false
    });
    return { success: true };
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    return { success: false, error: error.message };
  }
};

// Escuchar mensajes de un viaje
export const listenToMessages = (shipmentId, callback) => {
  const q = query(
    collection(db, CHATS_COLLECTION),
    where('shipmentId', '==', shipmentId),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (shipmentId, userId) => {
  // Implementación opcional
};  