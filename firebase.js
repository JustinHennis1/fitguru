import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDKkqlfTEW4A75nbS7-Gp3vJZZuM18lQFo",
  authDomain: "fitguru-c8e4b.firebaseapp.com",
  projectId: "fitguru-c8e4b",
  storageBucket: "fitguru-c8e4b.appspot.com",
  messagingSenderId: "986454679680",
  appId: "1:986454679680:web:943a7d84c2113918ab8665",
  measurementId: "G-70J47F0SYN"
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