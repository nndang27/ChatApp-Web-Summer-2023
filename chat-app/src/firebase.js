import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZor8ettIPU-rAgyjl5OwSwi3mWPy-kzE",
  authDomain: "fir-learning-25dbc.firebaseapp.com",
  projectId: "fir-learning-25dbc",
  storageBucket: "fir-learning-25dbc.appspot.com",
  messagingSenderId: "624789124397",
  appId: "1:624789124397:web:e4d1f30f175ef050430fa4",
  measurementId: "G-B8Q6JED3ZW",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const storage = getStorage();
export const db = getFirestore();
export const auth = getAuth();
