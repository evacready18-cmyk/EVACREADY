// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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