// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging'; // ← NUEVO

const firebaseConfig = {
 apiKey: "AIzaSyBQd7CmSN2jsiEOCn-7P3ngyboa2pD82CM",
  authDomain: "piaggioya-b9c47.firebaseapp.com",
  projectId: "piaggioya-b9c47",
  storageBucket: "piaggioya-b9c47.firebasestorage.app",
  messagingSenderId: "539480492550",
  appId: "1:539480492550:web:7f4ce259b3a7f4fa7f5187"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app); // ← NUEVO

export { auth, db, messaging, getToken, onMessage }; // ← NUEVO

