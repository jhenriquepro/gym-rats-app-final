import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyA332XqKrA03fYrBfvyz1kMPFo5Hcx5ZD0",
    authDomain: "gym-rats-6cc81.firebaseapp.com",
    projectId: "gym-rats-6cc81",
    storageBucket: "gym-rats-6cc81.firebasestorage.app",
    messagingSenderId: "221626713042",
    appId: "1:221626713042:web:b8099fafb23b6cd9597e0b"
};

let app, auth, googleProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} catch (error) {
    console.error("Firebase Init Error:", error);
}

export class AuthService {
    static async loginGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Google Auth Error:", error);
            throw error;
        }
    }

    static async loginEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return result.user;
        } catch (error) {
            // Tratamento para credenciais inválidas ou usuário inexistente
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                const confirmCreate = confirm("Usuário não encontrado ou senha incorreta.\nDeseja CRIAR uma nova conta?");
                if (confirmCreate) {
                    return this.registerEmail(email, password);
                }
            }
            throw error;
        }
    }

    static async registerEmail(email, password) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    }

    static async logout() {
        await signOut(auth);
        window.location.reload();
    }

    static onStateChanged(callback) {
        if (!auth) return;
        onAuthStateChanged(auth, callback);
    }
}