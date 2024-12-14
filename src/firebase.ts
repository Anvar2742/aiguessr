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
    apiKey: "AIzaSyATHUXAFdVoaFZqTncmorQcmW0OdaWAgic",
    authDomain: "aiguessr-vf.firebaseapp.com",
    databaseURL: "https://aiguessr-vf-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "aiguessr-vf",
    storageBucket: "aiguessr-vf.firebasestorage.app",
    messagingSenderId: "483659388718",
    appId: "1:483659388718:web:dbbb911107ce5fc1224cbf",
    measurementId: "G-TLTL3RZVWX",
    // databaseURL: 'http://127.0.0.1:5001?ns=aiguessr-vf', // Local emulator URL
};

const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app); // Initialize Realtime Database

// Connect to emulators if running locally
if (window.location.hostname === 'localhost') {
    console.log('Connecting to Firebase emulators...');
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectDatabaseEmulator(realtimeDb, 'localhost', 9001);
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
