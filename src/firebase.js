import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBGjY9HysY7YqTVucevkqnE3do2Ig9sYeo",
  authDomain: "canteen-coupon.firebaseapp.com",
  projectId: "canteen-coupon",
  storageBucket: "canteen-coupon.firebasestorage.app",
  messagingSenderId: "268484286314",
  appId: "1:268484286314:web:6c637bf7b6d3752f16f713"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);