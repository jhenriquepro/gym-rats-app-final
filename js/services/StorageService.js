// js/services/StorageService.js
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class StorageService {
    static userId = null;
    static dbInstance = null; // Guarda a conexão para não recriar sempre

    static setUserId(uid) {
        this.userId = uid;
        if (uid) console.log("Storage conectado ao usuário:", uid);
    }

    // [CORREÇÃO] Inicializa o Banco apenas quando necessário (Lazy Load)
    // Isso evita o erro "No Firebase App" ao iniciar o site
    static getDb() {
        if (!this.dbInstance) {
            try {
                this.dbInstance = getFirestore();
            } catch (e) {
                console.error("Erro ao conectar no Firestore:", e);
                return null;
            }
        }
        return this.dbInstance;
    }

    // --- Salvar (Tenta Nuvem, mas garante Local) ---
    static async save(key, data) {
        // 1. Salva Local (Garantia de Velocidade/Offline)
        try {
            const localKey = this.userId ? `user_${this.userId}_${key}` : key;
            localStorage.setItem(localKey, JSON.stringify(data));
        } catch (e) { console.error("Erro localStorage:", e); }

        // 2. Salva Nuvem (Se logado)
        if (this.userId) {
            const db = this.getDb();
            if (db) {
                try {
                    const userRef = doc(db, "users", this.userId);
                    await setDoc(userRef, { [key]: data }, { merge: true });
                } catch (e) {
                    console.error("Erro ao salvar na nuvem:", e);
                }
            }
        }
    }

    // --- Ler (Tenta Local, Sync carrega da nuvem separado) ---
    static get(key) {
        let localData = null;
        try {
            const localKey = this.userId ? `user_${this.userId}_${key}` : key;
            const str = localStorage.getItem(localKey);
            if (str) localData = JSON.parse(str);
        } catch (e) { console.error(e); }
        return localData;
    }

    // --- Sincronizar (Chamado no Login) ---
    static async syncFromCloud() {
        if (!this.userId) return;
        
        const db = this.getDb();
        if (!db) return;

        try {
            const userRef = doc(db, "users", this.userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                const keys = ['gym_rats_templates', 'gym_rats_history', 'gym_rats_full_logs'];
                
                keys.forEach(k => {
                    if (cloudData[k]) {
                        localStorage.setItem(`user_${this.userId}_${k}`, JSON.stringify(cloudData[k]));
                    }
                });
                console.log("Sincronização concluída.");
                return true;
            }
        } catch (e) {
            console.error("Erro no Sync:", e);
        }
        return false;
    }
}