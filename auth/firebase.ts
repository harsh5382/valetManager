import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAjOTICqrF66fqC6OeOekZo8ccquzkd0Ac",
  authDomain: "new-app-36b52.firebaseapp.com",
  projectId: "new-app-36b52",
  storageBucket: "new-app-36b52.appspot.com",
  messagingSenderId: "154771499597",
  appId: "1:154771499597:web:77fda7230aca820f1c8a04",
  measurementId: "G-PM4P75L53S",
};

const app = initializeApp(firebaseConfig);

// ✅ Use persistent auth storage for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export default app;
