// js/services/StorageService.js
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Inicializa Firestore (sem precisar importar 'app' se já foi iniciado no AuthService, 
// mas para garantir, pegamos a instância global ou recriamos simples)
const db = getFirestore();
const auth = getAuth();

export class StorageService {
    static userId = null;

    static setUserId(uid) {
        this.userId = uid;
        // Se logou, tenta sincronizar ou carregar dados da nuvem
        if (uid) {
            console.log("Usuário conectado no Storage:", uid);
        }
    }

    // Método Genérico para Salvar (Local ou Nuvem)
    static async save(key, data) {
        // 1. Sempre salva localmente para garantir rapidez e funcionamento offline
        try {
            const localKey = this.userId ? `user_${this.userId}_${key}` : key;
            localStorage.setItem(localKey, JSON.stringify(data));
        } catch (e) { console.error("Erro localStorage:", e); }

        // 2. Se estiver logado, salva na nuvem também
        if (this.userId) {
            try {
                // Cria uma referência ao documento do usuário: coleção 'users', documento 'ID_DO_USUARIO'
                const userRef = doc(db, "users", this.userId);
                
                // Salva o dado dentro de um objeto. Ex: { gym_rats_templates: [...] }
                // O { merge: true } garante que não apague outros dados do usuário
                await setDoc(userRef, { [key]: data }, { merge: true });
                console.log(`Dados '${key}' sincronizados na nuvem.`);
            } catch (e) {
                console.error("Erro Firestore Save:", e);
            }
        }
    }

    // Método Genérico para Ler (Tenta Nuvem primeiro, depois Local)
    static async get(key) {
        // 1. Tenta pegar do LocalStorage primeiro para ser instantâneo (cache)
        let localData = null;
        try {
            const localKey = this.userId ? `user_${this.userId}_${key}` : key;
            const str = localStorage.getItem(localKey);
            if (str) localData = JSON.parse(str);
        } catch (e) { console.error(e); }

        return localData;
    }

    // [NOVO] Método explícito para baixar da nuvem (usado ao fazer login)
    static async syncFromCloud() {
        if (!this.userId) return;

        try {
            const userRef = doc(db, "users", this.userId);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                
                // Atualiza o LocalStorage com o que veio da nuvem
                // As chaves principais do nosso app:
                const keys = ['gym_rats_templates', 'gym_rats_history', 'gym_rats_full_logs'];
                
                keys.forEach(k => {
                    if (cloudData[k]) {
                        const localKey = `user_${this.userId}_${k}`;
                        localStorage.setItem(localKey, JSON.stringify(cloudData[k]));
                    }
                });
                console.log("Sincronização da nuvem concluída.");
                return true; // Indica que houve sync
            }
        } catch (e) {
            console.error("Erro ao baixar da nuvem:", e);
        }
        return false;
    }
}