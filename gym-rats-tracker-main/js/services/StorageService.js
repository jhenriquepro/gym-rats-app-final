export class StorageService {
    static userId = null;

    // Define o usuário atual para segregar dados (User A não vê dados do User B)
    static setUserId(uid) {
        this.userId = uid;
    }

    static getKey(key) {
        return this.userId ? `user_${this.userId}_${key}` : key;
    }

    static save(key, data) {
        try {
            localStorage.setItem(this.getKey(key), JSON.stringify(data));
        } catch (error) {
            console.error("Storage Save Error:", error);
        }
    }

    static get(key) {
        try {
            const data = localStorage.getItem(this.getKey(key));
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error("Storage Read Error:", error);
            return null;
        }
    }
}