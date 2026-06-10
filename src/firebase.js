import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQd7CmSN2jsiEOCn-7P3ngyboa2pD82CM",
  authDomain: "piaggioya-b9c47.firebaseapp.com",
  projectId: "piaggioya-b9c47",
  storageBucket: "piaggioya-b9c47.firebasestorage.app",
  messagingSenderId: "539480492550",
  appId: "1:539480492550:web:7f4ce259b3a7f4fa7f5187"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;