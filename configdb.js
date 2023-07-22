/* // Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } =require("firebase/firestore");
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = initializeApp({
  apiKey: "AIzaSyBBVKrAAKNfzV49CDztR5EggpWo_e9XziE",
  authDomain: "finalyearproject-1e06f.firebaseapp.com",
  projectId: "finalyearproject-1e06f",
  storageBucket: "finalyearproject-1e06f.appspot.com",
  messagingSenderId: "509940526774",
  appId: "1:509940526774:web:2420d6c1539165e4834017",
  measurementId: "G-TZ1TDZ5Z4D"
});

// Initialize Firebase
//const app = initializeApp(firebaseConfig);
const firebase_db =  getFirestore(firebaseConfig);
//const analytics = getAnalytics(app);

module.exports = firebase_db; */