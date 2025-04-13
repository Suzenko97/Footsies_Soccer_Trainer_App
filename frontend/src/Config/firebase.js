import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

//Web App's Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCpMQv7pDb7UibqOhgrzEzVUriBmfX3fQY",
    authDomain: "footsies-app.firebaseapp.com",
    projectId: "footsies-app",
    storageBucket: "footsies-app.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
    measurementId: "G-TEST12345"
};

//Initialize Firebase
let app, auth, db, analytics;

try {
    app = initializeApp(firebaseConfig);
    analytics = getAnalytics(app);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Firebase initialization error:", error.message);
    // Create mock implementations to prevent app crashes
    auth = {
        onAuthStateChanged: (callback) => callback(null),
        signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase auth not available")),
        createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase auth not available")),
        signOut: () => Promise.resolve()
    };
    db = {
        collection: () => ({
            doc: () => ({
                get: () => Promise.resolve({ exists: false, data: () => ({}) }),
                set: () => Promise.resolve()
            })
        })
    };
}

export { auth, db };