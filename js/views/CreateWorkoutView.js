import { StorageService } from '../services/StorageService.js';

export class CreateWorkoutView {
    constructor() {
        this.form = document.getElementById('form-create-workout');
        this.inpName = document.getElementById('inp-plan-name');
        this.inpExName = document.getElementById('inp-new-exercise');
        this.inpExSets = document.getElementById('inp-new-sets');
        this.list = document.getElementById('preview-list');
        this.submitBtn = this.form.querySelector('button[type="submit"]');

        this.exercises = [];
        this.editingId = null;
        this.init();
    }

    init() {
        // Atributos de segurança HTML
        this.inpName.setAttribute('maxlength', '25');
        this.inpExName.setAttribute('maxlength', '50');
        this.inpExSets.setAttribute('max', '10');

        document.getElementById('btn-append-exercise').addEventListener('click', () => this.addExercise());
        document.getElementById('btn-cancel-create').addEventListener('click', () => this.cancel());
        this.form.addEventListener('submit', (e) => { e.preventDefault(); this.save(); });
    }

    addExercise() {
        const name = this.inpExName.value.trim();
        const sets = parseInt(this.inpExSets.value);
        const err = "Regras:\n- Nome: máx 50 caracteres\n- Séries: máx 10";

        if (!name) return alert("Digite o nome do exercício");
        if (name.length > 50) return alert(err);
        if (isNaN(sets) || sets < 1 || sets > 10) {
            alert(err);
            this.inpExSets.value = '';
            return;
        }

        this.exercises.push({ name, sets });
        this.render();
        this.inpExName.value = '';
        this.inpExSets.value = '';
        this.inpExName.focus();
    }

    render() {
        this.list.innerHTML = '';
        this.exercises.forEach((ex, i) => {
            const li = document.createElement('li');
            li.className = 'preview-item'; // CSS deve estilizar isso
            li.style.cssText = "display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;";
            li.innerHTML = `<span><strong>${ex.name}</strong> (${ex.sets} séries)</span> <button type="button" class="btn-remove" style="color:red; background:none; border:none;">✕</button>`;

            li.querySelector('.btn-remove').addEventListener('click', () => {
                this.exercises.splice(i, 1);
                this.render();
            });
            this.list.appendChild(li);
        });
    }

    save() {
        const name = this.inpName.value.trim();
        if (!name) return alert("Nome do treino é obrigatório");
        if (this.exercises.length === 0) return alert("Adicione exercícios");
        if (this.exercises.some(e => e.sets > 10)) return alert("Erro: Exercícios com > 10 séries detectados.");

        const workouts = StorageService.get('gym_rats_templates') || [];
        const data = { id: this.editingId || Date.now(), name, exercises: this.exercises };

        if (this.editingId) {
            const idx = workouts.findIndex(w => w.id === this.editingId);
            if (idx !== -1) workouts[idx] = data;
        } else {
            workouts.push(data);
        }

        StorageService.save('gym_rats_templates', workouts);
        alert("Treino Salvo!");
        this.cancel();
    }

    loadTemplateForEditing(t) {
        this.editingId = t.id;
        this.inpName.value = t.name;
        this.exercises = [...t.exercises];
        this.submitBtn.innerText = "ATUALIZAR TREINO";
        this.render();
    }

    cancel() {
        this.editingId = null;
        this.exercises = [];
        this.form.reset();
        this.list.innerHTML = '';
        this.submitBtn.innerText = "SALVAR TREINO";
        document.querySelector('[data-target="view-dashboard"]').click();
    }
}