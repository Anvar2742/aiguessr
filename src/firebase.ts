// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDiaDB0vwbqFiPEoC_8udejNFp3uSlJNis",
    authDomain: "aiguessr-01.firebaseapp.com",
    projectId: "aiguessr-01",
    storageBucket: "aiguessr-01.firebasestorage.app",
    messagingSenderId: "564681501612",
    appId: "1:564681501612:web:fe7163d93ed036a6fa6809",
    measurementId: "G-H8NLVXLT87"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, db, collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot };