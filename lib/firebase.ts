
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

// Cấu hình Firebase thực tế cho project iotthuc
const firebaseConfig = {
  apiKey: "AIzaSyAEqAFIzo6LsbYYLXzfrA1t2Q1notYJjO4",
  authDomain: "iotthuc.firebaseapp.com",
  databaseURL: "https://iotthuc.firebaseio.com",
  projectId: "iotthuc",
  storageBucket: "iotthuc.appspot.com",
  messagingSenderId: "1018859871923",
  appId: "1:1018859871923:web:a6ddbc98dc1c5ebed29ac6",
  measurementId: "G-LN07WL42VK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
