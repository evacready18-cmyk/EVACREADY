// Import the functions you need from the SDKs you need
import { initializeApp, deleteApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

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
const db = getFirestore(app);

export { db };

export async function syncUserProfile(user, extraData = {}, firestoreInstance = db) {
  const userDocRef = doc(firestoreInstance, "users", user.uid)
  const userSnapshot = await getDoc(userDocRef)

  const profile = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || extraData.name || "",
    role: extraData.role || "user",
    barangay: extraData.barangay || "",
    phone: extraData.phone || "",
    provider: extraData.provider || "email",
    updatedAt: serverTimestamp(),
    ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
  }

  await setDoc(userDocRef, profile, { merge: true })
  return profile
}

export async function registerWithEmailPassword({ email, password, name, role = "user", barangay = "", phone = "" }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  await syncUserProfile(credential.user, { name, role, barangay, phone, provider: "email" })
  return credential.user
}

// Creates a Firebase Auth account for a staff member using a temporary secondary
// app instance so the admin's own signed-in session is not replaced in the process.
export async function createStaffAccount({ email, password, name, barangay = "" }) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  const secondaryDb = getFirestore(secondaryApp)
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await updateProfile(credential.user, { displayName: name })
    // Written via the secondary auth session (the new user) so it satisfies own-document security rules.
    await syncUserProfile(credential.user, { name, role: "staff", barangay, provider: "email" }, secondaryDb)
    return credential.user
  } finally {
    await signOut(secondaryAuth)
    await deleteApp(secondaryApp)
  }
}

export async function signInWithEmailPassword(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

export async function signOutUser() {
  await signOut(auth)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, provider)
  const user = credential.user

  await syncUserProfile(user, {
    name: user.displayName || "",
    role: "user",
    provider: "google",
  })

  return user
}

export function getCurrentUser() {
  return auth.currentUser
}

export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback)
}

export async function createDocument(collectionName, data) {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
  });

  return docRef;
}

export async function createUserProfile(userData) {
  const docRef = await addDoc(collection(db, "users"), {
    ...userData,
    createdAt: serverTimestamp(),
  });

  return docRef;
}

// Normalizes barangay names so common abbreviations (e.g. "Brgy 5") match their
// full form (e.g. "Barangay 5").
function normalizeBarangay(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\bbrgy\.?\b/g, "barangay")
    .replace(/\s+/g, " ")
}

// Live-subscribes to the "users" collection, optionally filtered by role and/or barangay.
// Both are compared client-side (trimmed, case-insensitive) since manually edited
// records can differ in casing/whitespace from the dropdown-selected/registered value.
export function subscribeToUsers({ role, barangay } = {}, callback) {
  const normalizedRole = role ? role.trim().toLowerCase() : ""
  const normalizedBarangay = normalizeBarangay(barangay)

  return onSnapshot(collection(db, "users"), (snapshot) => {
    let users = snapshot.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }))
    if (normalizedRole) {
      users = users.filter((user) => (user.role || "").trim().toLowerCase() === normalizedRole)
    }
    if (normalizedBarangay) {
      users = users.filter((user) => normalizeBarangay(user.barangay) === normalizedBarangay)
    }
    callback(users)
  }, (error) => {
    console.error("Error subscribing to users:", error)
    callback([])
  })
}

export async function updateUserProfileFields(uid, updates) {
  await updateDoc(doc(db, "users", uid), updates)
}

export async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, "users", uid))
}

export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid))
  return snapshot.exists() ? snapshot.data() : null
}

// Live-subscribes to a single user's profile document (e.g. to react to admin edits without re-login).
export function subscribeToUserProfile(uid, callback) {
  return onSnapshot(doc(db, "users", uid), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null)
  })
}