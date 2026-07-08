import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDFRSHi0A96XjqY5MskppcM6L_yPGYDcpg",
  authDomain: "wallet-6185f.firebaseapp.com",
  projectId: "wallet-6185f",
  storageBucket: "wallet-6185f.firebasestorage.app",
  messagingSenderId: "487575343661",
  appId: "1:487575343661:web:e608577bc82b3a8c4e5ea4",
  measurementId: "G-8C7GL7Z9DE"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();