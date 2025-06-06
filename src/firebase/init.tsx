// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCXgTvqQhX93iOaFjbkSs_ZE6PTtm2m5CM",
  authDomain: "ugowater-c8967.firebaseapp.com",
  projectId: "ugowater-c8967",
  storageBucket: "ugowater-c8967.firebasestorage.app",
  messagingSenderId: "829755877297",
  appId: "1:829755877297:web:8aa854bda45605e79b3f90",
  measurementId: "G-8FP0Q5T7LH",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// const analytics = getAnalytics(app);
