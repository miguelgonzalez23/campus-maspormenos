
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBU8itAfv6GlqaHWBSlM3a6giQCHp50H0c",
  authDomain: "campus-maspormenos-d4692.firebaseapp.com",
  projectId: "campus-maspormenos-d4692",
  storageBucket: "campus-maspormenos-d4692.firebasestorage.app",
  messagingSenderId: "148170839385",
  appId: "1:148170839385:web:5931b54996915212a52848"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
