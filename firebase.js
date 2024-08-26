import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCUMZVnRhym5QHIUywfB31CgeL_OvNE6dY",
  authDomain: "fitguru-3b312.firebaseapp.com",
  projectId: "fitguru-3b312",
  storageBucket: "fitguru-3b312.appspot.com",
  messagingSenderId: "690974489855",
  appId: "1:690974489855:web:cb07e0956f8f840b1f60ca",
  measurementId: "G-FTF7SS5BBL"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };