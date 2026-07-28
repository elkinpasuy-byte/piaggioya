// src/hooks/useNotifications.js
import { useEffect } from 'react';
import { messaging, getToken, onMessage } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const useNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('⏳ Usuario no autenticado, esperando...');
      return;
    }

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BM6sfYdHKsAfnCjgNVweCHXGO7O7sSODgGNE5IZy8svvzoOj6Ss3CKGPfc-YiLAWmu8HCvhYIaldK6JqnPyh0Bs' // ← REEMPLAZA CON TU CLAVE
          });

          // Guardar token en Firestore
          if (user?.uid) {
            await setDoc(doc(db, 'users', user.uid), {
              fcmToken: token,
              fcmTokenUpdated: new Date().toISOString()
            }, { merge: true });
            console.log('✅ Token FCM guardado en Firestore:', token);
          } else {
            console.warn('⚠️ Usuario no autenticado, no se guarda token');
          }
        } else {
          console.log('❌ Permiso de notificaciones denegado');
        }
      } catch (error) {
        console.error('❌ Error obteniendo token FCM:', error.message);
      }
    };

    requestPermission();

    // Escuchar mensajes en primer plano
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('📩 Notificación en primer plano:', payload);
      const title = payload.notification?.title || 'PiaggioYa';
      const body = payload.notification?.body || '';
      toast.success(`${title}: ${body}`, {
        duration: 5000,
        position: 'top-center',
      });
    });

    return () => unsubscribe();
  }, [user]);
};