// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
 apiKey: "AIzaSyBQd7CmSN2jsiEOCn-7P3ngyboa2pD82CM",
  authDomain: "piaggioya-b9c47.firebaseapp.com",
  projectId: "piaggioya-b9c47",
  storageBucket: "piaggioya-b9c47.firebasestorage.app",
  messagingSenderId: "539480492550",
  appId: "1:539480492550:web:7f4ce259b3a7f4fa7f5187"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en background:', payload);
  
  const notificationTitle = payload.notification?.title || 'PiaggioYa';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una notificación',
    icon: '/logo3.png',
    data: payload.data || {},
    badge: '/logo3.png',
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});