// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCKHpTCE-Z_61t2wYZWfi0iGuB00nrz7NE",
  authDomain: "evacready.firebaseapp.com",
  projectId: "evacready",
  storageBucket: "evacready.firebasestorage.app",
  messagingSenderId: "279856673348",
  appId: "1:279856673348:web:8543720d8e673260124211",
  measurementId: "G-GHPV6BGPXW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export async function registerWithEmailPassword({ email, password, name }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  return credential.user
}

export async function signInWithEmailPassword(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutUser() {
  await signOut(auth)
}