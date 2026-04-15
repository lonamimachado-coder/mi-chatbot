// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRlVs6JAkyt5Op-mUGaLXbI95fwewH_n4",
  authDomain: "imapersonal-79a48.firebaseapp.com",
  projectId: "imapersonal-79a48",
  storageBucket: "imapersonal-79a48.firebasestorage.app",
  messagingSenderId: "226302507123",
  appId: "1:226302507123:web:bac73982b2cab122aa5206",
  measurementId: "G-8H4BHJVGBK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
