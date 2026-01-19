// js/views/LogWorkoutView.js
import { Workout } from '../models/Workout.js';
import { StorageService } from '../services/StorageService.js';
import { Timer } from '../utils/Timer.js';

export class LogWorkoutView {
    constructor() {
        this.container = document.getElementById('sets-container');
        this.title = document.getElementById('log-title');
        this.timerElem = null;
        this.workout = null;
        this.activeTimers = {}; // Guarda IDs dos intervalos de descanso

        this.mainTimer = new Timer(time => {
            if (this.timerElem) this.timerElem.innerText = time;
        });

        this.init();
    }

    init() {
        this.createHeaderTimer();
        document.getElementById('form-log-workout').addEventListener('submit', e => {
            e.preventDefault();
            this.finish();
        });
        document.getElementById('btn-cancel-log').addEventListener('click', () => {
            if (confirm("Cancelar treino?")) this.exit();
        });
    }

    createHeaderTimer() {
        if (document.getElementById('workout-timer-display')) return;
        const div = document.createElement('div');
        div.id = 'workout-timer-display';
        div.className = 'timer-display';
        div.innerText = "00:00";
        document.querySelector('#view-log-workout .view-header').appendChild(div);
        this.timerElem = div;
    }

    startNewSession(template) {
        this.workout = new Workout(null, template.name);
        this.container.innerHTML = '';
        this.activeTimers = {};

        // Verificação Retroativa
        const retroDate = StorageService.get('gym_rats_temp_retro_date');
        if (retroDate) {
            const d = new Date(retroDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            this.title.innerHTML = `${template.name}<br><small style="color:var(--color-primary); font-size:0.7rem">Retroativo: ${d}</small>`;
        } else {
            this.title.innerText = template.name;
        }

        // Setup Exercícios
        template.exercises.forEach(ex => this.workout.addExercise(ex.name, ex.sets));

        this.render();
        this.workout.start();
        this.mainTimer.start();
    }

    // Gera o Dropdown de RPE com Cores
    generateRpeSelect(currentVal, exIdx, sIdx) {
        let optionsHtml = '<option value="" style="color:#888">RPE</option>';

        for (let i = 1; i <= 10; i++) {
            const hue = 120 - ((i - 1) * (120 / 9));
            const color = `hsl(${hue}, 100%, 50%)`;
            const selected = i == currentVal ? 'selected' : '';
            optionsHtml += `<option value="${i}" style="color:${color}; font-weight:bold;" ${selected}>${i}</option>`;
        }

        let initialColor = '#fff';
        if (currentVal) {
            const hue = 120 - ((currentVal - 1) * (120 / 9));
            initialColor = `hsl(${hue}, 100%, 50%)`;
        }

        return `
            <select class="inp-set inp-rpe" 
                    style="color: ${initialColor}; font-weight: bold;" 
                    data-idx="${exIdx},${sIdx},rpe"
                    onchange="this.style.color = this.options[this.selectedIndex].style.color">
                ${optionsHtml}
            </select>
        `;
    }

    render() {
        this.container.innerHTML = '';
        this.workout.exercises.forEach((ex, exIdx) => {
            const card = document.createElement('div');
            card.className = 'exercise-card';

            let html = `<div class="exercise-header">${ex.name}</div>`;

            // Cabeçalho Simples (KG, REPS, RPE) - Sem #
            html += `
                <div class="sets-header">
                    <span>KG</span>
                    <span>REPS</span>
                    <span>RPE</span>
                </div>
            `;

            // Séries (Sem número da série na esquerda)
            ex.sets.forEach((set, sIdx) => {
                html += `
                <div class="set-row">
                    <input type="number" class="inp-set" placeholder="-" 
                           data-idx="${exIdx},${sIdx},weight" value="${set.weight || ''}">
                           
                    <input type="number" class="inp-set" placeholder="-" 
                           data-idx="${exIdx},${sIdx},reps" value="${set.reps || ''}">
                    
                    ${this.generateRpeSelect(set.rpe, exIdx, sIdx)}
                </div>`;
            });

            // Timer de Descanso (Abaixo, limpo)
            html += `
                <div class="set-row">
                    <div class="rest-timer-box" id="rest-${exIdx}">
                        <span class="rest-label">Descanso</span>
                        <div class="timer-inputs" id="inputs-${exIdx}">
                            <input type="number" class="inp-timer min" value="1"> : <input type="number" class="inp-timer sec" value="30">
                        </div>
                        <div class="timer-countdown-text hidden" id="disp-${exIdx}">00:00</div>
                        <button type="button" class="btn-timer-toggle" data-ex="${exIdx}">▶</button>
                    </div>
                </div>
            `;

            card.innerHTML = html;
            this.container.appendChild(card);
        });

        // Event Listeners
        this.container.querySelectorAll('.inp-set').forEach(inp => {
            const eventType = inp.tagName === 'SELECT' ? 'change' : 'input';
            inp.addEventListener(eventType, e => {
                const [ex, s, field] = e.target.dataset.idx.split(',');
                this.workout.exercises[ex].sets[s][field] = e.target.value;
            });
        });

        this.container.querySelectorAll('.btn-timer-toggle').forEach(btn => {
            btn.addEventListener('click', e => this.toggleRest(e.target.dataset.ex, btn));
        });
    }

    toggleRest(idx, btn) {
        const box = document.getElementById(`rest-${idx}`);
        const inputs = document.getElementById(`inputs-${idx}`);
        const disp = document.getElementById(`disp-${idx}`);

        if (this.activeTimers[idx]) {
            // Parar
            clearInterval(this.activeTimers[idx]);
            delete this.activeTimers[idx];
            box.classList.remove('running');
            inputs.classList.remove('hidden');
            disp.classList.add('hidden');
            btn.innerText = "▶";
        } else {
            // Iniciar
            let s = (parseInt(inputs.querySelector('.min').value) || 0) * 60 + (parseInt(inputs.querySelector('.sec').value) || 0);
            if (s <= 0) return;

            box.classList.add('running');
            inputs.classList.add('hidden');
            disp.classList.remove('hidden');
            btn.innerText = "■";

            const tick = () => {
                const m = Math.floor(s / 60).toString().padStart(2, '0');
                const sec = (s % 60).toString().padStart(2, '0');
                disp.innerText = `${m}:${sec}`;
            };
            tick();

            this.activeTimers[idx] = setInterval(() => {
                s--;
                if (s < 0) {
                    this.toggleRest(idx, btn); // Auto stop
                    box.style.backgroundColor = 'rgba(50,255,0,0.3)';
                    setTimeout(() => box.style.backgroundColor = '', 500);
                } else {
                    tick();
                }
            }, 1000);
        }
    }

    finish() {
        if (!confirm("Salvar treino?")) return;

        this.mainTimer.stop();
        Object.values(this.activeTimers).forEach(id => clearInterval(id));

        const retro = StorageService.get('gym_rats_temp_retro_date');
        let date = retro ? new Date(retro + 'T12:00:00') : new Date();
        if (retro) StorageService.save('gym_rats_temp_retro_date', null);

        this.workout.endTime = date.getTime();

        const hist = StorageService.get('gym_rats_history') || [];
        hist.push({ id: this.workout.id, name: this.workout.name, dateString: date.toDateString() });
        StorageService.save('gym_rats_history', hist);

        const logs = StorageService.get('gym_rats_full_logs') || [];
        const record = JSON.parse(JSON.stringify(this.workout));
        record.dateISO = date.toISOString().split('T')[0];
        logs.push(record);
        StorageService.save('gym_rats_full_logs', logs);

        alert("Treino Salvo!");
        this.exit(retro ? 'view-records' : 'view-dashboard');
    }

    exit(target = 'view-dashboard') {
        this.mainTimer.stop();
        Object.values(this.activeTimers).forEach(id => clearInterval(id));
        this.workout = null;
        this.container.innerHTML = '';
        this.title.innerText = "Treino";
        document.querySelector(`[data-target="${target}"]`).click();

        if (target === 'view-records') {
            setTimeout(() => document.getElementById('btn-search-records').click(), 200);
        }
    }
}