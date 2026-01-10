// Firebase service for university database

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6QVAAIBGpnt8QBAScj3gMQmnQijqX_vk",
  authDomain: "cpaapp-8c4d6.firebaseapp.com",
  projectId: "cpaapp-8c4d6",
  storageBucket: "cpaapp-8c4d6.firebasestorage.app",
  messagingSenderId: "182638554959",
  appId: "1:182638554959:web:3e5e126b379c6c68c1df3a"
};

let app: any = null;
let db: Firestore | null = null;

export function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return db;
}

export interface University {
  id: string;
  name?: string;
  nameEn?: string;
  city?: string;
  type?: string;
  founded?: number;
  website?: string;
  address?: string;
  district?: string;
  [key: string]: any;
}

export async function loadUniversities(): Promise<University[]> {
  if (!db) {
    db = initializeFirebase();
  }

  try {
    const universitiesCollection = collection(db, 'universities');
    const snapshot = await getDocs(universitiesCollection);
    
    const universities: University[] = [];
    snapshot.forEach((doc) => {
      universities.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return universities;
  } catch (error) {
    console.error('Error loading universities:', error);
    throw error;
  }
}
