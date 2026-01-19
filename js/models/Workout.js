export class Workout {
    constructor(id = null, name = '') {
        this.id = id || Date.now();
        this.name = name;
        this.startTime = null;
        this.endTime = null;
        this.exercises = [];
    }

    start() {
        if (!this.startTime) {
            this.startTime = Date.now();
        }
    }

    // Adiciona exercício criando os slots de séries vazios
    addExercise(name, setsCount) {
        const newExercise = {
            id: Date.now() + Math.random(), // ID único interno
            name: name,
            sets: Array.from({ length: setsCount }, (_, i) => ({
                index: i + 1,
                weight: '',
                reps: '',
                rpe: '',
                completed: false
            }))
        };
        this.exercises.push(newExercise);
    }

    // Atualiza um campo específico de uma série (peso, reps, rpe)
    updateSet(exerciseIndex, setIndex, field, value) {
        if (this.exercises[exerciseIndex]?.sets[setIndex]) {
            this.exercises[exerciseIndex].sets[setIndex][field] = value;
        }
    }
}