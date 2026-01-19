// js/services/ExportService.js

export class ExportService {

    // --- EXCEL ---
    static async exportToExcel(workout, fileName = 'Workout') {
        try {
            await this.loadScript('https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js');

            const workbook = XLSX.utils.book_new();

            // 1. Aba Resumo
            const summary = this.generateSummary(workout);
            const summarySheet = XLSX.utils.json_to_sheet(summary);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

            // 2. Aba Detalhes
            const exerciseData = this.flattenExercises(workout.exercises);
            const exerciseSheet = XLSX.utils.json_to_sheet(exerciseData);
            this.styleExcelSheet(exerciseSheet);
            XLSX.utils.book_append_sheet(workbook, exerciseSheet, 'Exercícios');

            XLSX.writeFile(workbook, `${fileName}.xlsx`);
        } catch (e) {
            console.error("Erro Excel:", e);
            alert("Erro ao exportar Excel. Verifique a conexão.");
        }
    }

    // --- PDF ---
    static async exportToPDF(workout, fileName = 'Workout') {
        try {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 15;

            // Cabeçalho
            doc.setFontSize(18);
            doc.text('RELATÓRIO DE TREINO', pageWidth / 2, y, { align: 'center' });
            y += 10;

            // Resumo
            doc.setFontSize(10);
            // [CORREÇÃO] Forçando 'pt-BR'
            const date = new Date(workout.startTime).toLocaleDateString('pt-BR');
            const duration = this.calculateDuration(workout.startTime, workout.endTime);

            doc.text(`Nome: ${workout.name || 'Sem Nome'}`, 15, y); y += 6;
            doc.text(`Data: ${date}`, 15, y); y += 6;
            doc.text(`Duração: ${duration}`, 15, y); y += 10;

            // Tabela
            doc.setFontSize(12);
            doc.text('DETALHES', 15, y);
            y += 5;

            const tableData = workout.exercises.map(ex => [
                ex.name,
                ex.sets.length,
                ex.sets.map(s => `${s.weight || 0}kg x ${s.reps || 0}`).join(' | ')
            ]);

            doc.autoTable({
                head: [['Exercício', 'Séries', 'Carga x Repetições']],
                body: tableData,
                startY: y,
                theme: 'grid',
                headStyles: { fillColor: [204, 255, 0], textColor: [0, 0, 0], fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });

            doc.save(`${fileName}.pdf`);
        } catch (e) {
            console.error("Erro PDF:", e);
            alert("Erro ao gerar PDF.");
        }
    }

    // --- CSV ---
    static exportToCSV(workout, fileName = 'Workout') {
        const rows = [];
        rows.push(['RELATORIO DE TREINO']);
        rows.push([]);

        // [CORREÇÃO] Forçando Data em PT-BR
        const datePt = new Date(workout.startTime).toLocaleDateString('pt-BR');

        rows.push([
            'Data:', datePt,
            'Duracao:', this.calculateDuration(workout.startTime, workout.endTime)
        ]);
        rows.push([]);
        rows.push(['Exercicio', 'Serie', 'Peso (kg)', 'Reps', 'RPE']);

        workout.exercises.forEach(exercise => {
            exercise.sets.forEach((set) => {
                rows.push([
                    exercise.name,
                    set.index,
                    set.weight || '-',
                    set.reps || '-',
                    set.rpe || '-'
                ]);
            });
        });

        const csvContent = rows.map(row =>
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // ===== UTILITÁRIOS =====

    static async loadScript(src) {
        if (document.querySelector(`script[src="${src}"]`)) return;
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    static generateSummary(workout) {
        const startDate = new Date(workout.startTime);
        return [{
            'Data': startDate.toLocaleDateString('pt-BR'), // [CORREÇÃO] Forçando PT-BR
            'Inicio': startDate.toLocaleTimeString('pt-BR'),
            'Duracao': this.calculateDuration(workout.startTime, workout.endTime),
            'Exercicios': workout.exercises.length,
            'Total Series': workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
        }];
    }

    static flattenExercises(exercises) {
        const flattened = [];
        exercises.forEach((exercise) => {
            exercise.sets.forEach((set) => {
                flattened.push({
                    'Exercicio': exercise.name,
                    'Serie #': set.index,
                    'Peso (kg)': set.weight || '-',
                    'Reps': set.reps || '-',
                    'RPE': set.rpe || '-'
                });
            });
        });
        return flattened;
    }

    static styleExcelSheet(sheet) {
        if (!sheet['!cols']) sheet['!cols'] = [];
        sheet['!cols'] = [{ wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 8 }];
    }

    static calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return 'N/A';
        const diffMs = endTime - startTime;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
}