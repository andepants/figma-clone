// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB23dZYXQyKc8olOGYe9dSTmGUwWcNPogg",
  authDomain: "figma-clone-d33e3.firebaseapp.com",
  projectId: "figma-clone-d33e3",
  storageBucket: "figma-clone-d33e3.firebasestorage.app",
  messagingSenderId: "738106277301",
  appId: "1:738106277301:web:17d7f463a16facfce02dfc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const storage = getStorage(app);

export default app;
