import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBi1H1XYWrQRvR5Q0lN4DeWYwi2vy-suIk",
  authDomain: "k-bike-1f7da.firebaseapp.com",
  projectId: "k-bike-1f7da",
  storageBucket: "k-bike-1f7da.firebasestorage.app",
  messagingSenderId: "497068103998",
  appId: "1:497068103998:web:a67bf77a051fc4ecf7346f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
