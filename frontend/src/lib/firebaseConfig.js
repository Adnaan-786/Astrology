import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQhGeWTUQqgjJrXa7jLn_yOyI1-1v63ds",
  authDomain: "astrovedic-ai.firebaseapp.com",
  projectId: "astrovedic-ai",
  storageBucket: "astrovedic-ai.firebasestorage.app",
  messagingSenderId: "869016377247",
  appId: "1:869016377247:web:347f8a4ed216a8cad30faa",
  measurementId: "G-SJ9Z05ZWRV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
