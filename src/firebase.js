// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyArwdDZcOgov0NmnmAdNzrW3bOzWDjRXHk",
  authDomain: "case-referral-system.firebaseapp.com",
  projectId: "case-referral-system",
  storageBucket: "case-referral-system.firebasestorage.app",
  messagingSenderId: "89787721292",
  appId: "1:89787721292:web:f21eed81948cdc6c5836e9",
  measurementId: "G-31EV2X1S8N"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
