import { StorageService } from '../services/StorageService.js';

export class DashboardView {
    constructor() {
        this.container = document.getElementById('dashboard-stats-container');
        this.viewDate = new Date(); // Controla o mês visualizado
        this.init();
    }

    init() {
        this.renderCalendar();
    }

    renderCalendar() {
        const history = StorageService.get('gym_rats_history') || [];
        // Set de datas únicas formatadas (ex: "Sun Oct 01 2025")
        const workoutDates = new Set(history.map(h => h.dateString));

        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const todayStr = new Date().toDateString();

        // Gerar Dropdowns
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const monthOpts = months.map((m, i) => `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`).join('');

        let yearOpts = '';
        for (let y = 2026; y <= 2030; y++) yearOpts += `<option value="${y}" ${y === year ? 'selected' : ''}>${y}</option>`;

        // Gerar Grade de Dias
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startDay = new Date(year, month, 1).getDay();

        let grid = '';
        for (let i = 0; i < startDay; i++) grid += `<div class="calendar-day empty"></div>`;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = new Date(year, month, i).toDateString();
            let cls = 'calendar-day';
            if (workoutDates.has(dateStr)) cls += ' day-active';
            if (dateStr === todayStr) cls += ' day-today';
            grid += `<div class="${cls}">${i}</div>`;
        }

        // Renderizar
        this.container.innerHTML = `
            <div class="calendar-wrapper">
                <div class="calendar-controls">
                    <select id="sel-cal-month" class="inp-cal-select">${monthOpts}</select>
                    <select id="sel-cal-year" class="inp-cal-select">${yearOpts}</select>
                </div>
                <div class="calendar-grid">${grid}</div>
                <div class="calendar-footer">
                    <div class="calendar-legend"><span class="dot-legend"></span> Treino Feito</div>
                </div>
            </div>
        `;

        // Eventos
        this.container.querySelector('#sel-cal-month').addEventListener('change', e => {
            this.viewDate.setMonth(parseInt(e.target.value));
            this.renderCalendar();
        });
        this.container.querySelector('#sel-cal-year').addEventListener('change', e => {
            this.viewDate.setFullYear(parseInt(e.target.value));
            this.renderCalendar();
        });
    }
}