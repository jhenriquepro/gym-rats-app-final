import { StorageService } from '../services/StorageService.js';
import { ExportService } from '../services/ExportService.js';

export class RecordsView {
    constructor() {
        this.startInp = document.getElementById('inp-date-start');
        this.endInp = document.getElementById('inp-date-end');
        this.list = document.getElementById('records-results-list');
        this.init();
    }

    init() {
        const today = new Date().toISOString().split('T')[0];
        this.startInp.value = today;
        this.endInp.value = today;

        document.getElementById('btn-back-records').addEventListener('click', () => {
            document.querySelector('[data-target="view-dashboard"]').click();
        });

        document.getElementById('btn-search-records').addEventListener('click', () => this.search());
    }

    search() {
        const s = this.startInp.value;
        const e = this.endInp.value;
        if (!s || !e) return alert("Selecione as datas.");

        const logs = StorageService.get('gym_rats_full_logs') || [];
        const found = logs.filter(l => l.dateISO >= s && l.dateISO <= e);
        this.render(found, s, e);
    }

    render(logs, s, e) {
        this.list.innerHTML = '';

        if (logs.length === 0) {
            this.list.innerHTML = `
                <div class="text-center" style="padding:30px;">
                    <p style="color:#666; margin-bottom:15px">Nenhum registro encontrado.</p>
                    <button id="btn-retro" class="btn-primary" style="background:transparent; border:1px solid var(--color-primary); color:var(--color-primary)">
                        + Adicionar Treino Retroativo
                    </button>
                </div>
            `;
            document.getElementById('btn-retro').addEventListener('click', () => {
                if (s !== e) return alert("Selecione apenas UM DIA (Início = Fim) para adicionar retroativo.");

                StorageService.save('gym_rats_temp_retro_date', s);
                // "Hack" de roteamento: Clica no botão do Dashboard para abrir o fluxo normal de seleção
                document.getElementById('btn-start-selection').click();
            });
            return;
        }

        logs.forEach(log => {
            const vol = log.exercises.reduce((acc, ex) => acc + ex.sets.reduce((a, st) => a + ((st.weight || 0) * (st.reps || 0)), 0), 0);
            const date = new Date(log.dateISO + 'T12:00:00').toLocaleDateString('pt-BR');

            const div = document.createElement('div');
            div.className = 'record-card';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:10px;">
                    <div><strong style="color:var(--color-primary)">${log.name}</strong><br><small style="color:#888">${date}</small></div>
                    <div class="text-right"><small>Volume</small><br><strong>${vol.toLocaleString()} kg</strong></div>
                </div>
                <div>${log.exercises.map(ex => `<div style="display:flex; justify-content:space-between; color:#ccc; font-size:0.9rem"><span>${ex.name}</span><span>${ex.sets.length} séries</span></div>`).join('')}</div>
                <button class="btn-pdf btn-secondary" style="width:100%; margin-top:10px; font-size:0.8rem">📄 PDF</button>
            `;
            div.querySelector('.btn-pdf').addEventListener('click', () => ExportService.exportToPDF(log, `${log.name}_${log.dateISO}`));
            this.list.appendChild(div);
        });
    }
}