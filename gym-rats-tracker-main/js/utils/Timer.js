export class Timer {
    constructor(onTick) {
        this.interval = null;
        this.startTime = null;
        this.onTick = onTick; // Callback para atualizar UI
    }

    start(existingStart = null) {
        this.stop();
        this.startTime = existingStart || Date.now();
        this.tick();
        this.interval = setInterval(() => this.tick(), 1000);
        return this.startTime;
    }

    stop() {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    }

    tick() {
        if (!this.startTime) return;
        const diff = Date.now() - this.startTime;

        const totSec = Math.floor(diff / 1000);
        const m = Math.floor(totSec / 60).toString().padStart(2, '0');
        const s = (totSec % 60).toString().padStart(2, '0');

        if (this.onTick) this.onTick(`${m}:${s}`);
    }
}