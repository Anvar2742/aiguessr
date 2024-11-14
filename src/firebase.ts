import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    connectAuthEmulator
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    connectFirestoreEmulator
} from 'firebase/firestore';
import {
    getDatabase,
    ref,
    set,
    update,
    remove,
    onValue,
    connectDatabaseEmulator
} from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyDLEpapzE_aaPprvvu9I3NLxQngqwesXAs",
    authDomain: "aiguessr-v1.firebaseapp.com",
    // databaseURL: "https://aiguessr-v1-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "aiguessr-v1",
    storageBucket: "aiguessr-v1.firebasestorage.app",
    messagingSenderId: "181640497289",
    appId: "1:181640497289:web:ec33db88e68502eb9b9e58",
    measurementId: "G-V240NXPKX4",
    databaseURL: "http://127.0.0.1:4000"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app); // Initialize Realtime Database

// Connect to emulators if running locally
if (window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
}

export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    db,
    realtimeDb,       // Export Realtime Database instance
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    ref,              // Export Realtime Database utilities
    set,
    update,
    remove,
    onValue
};
