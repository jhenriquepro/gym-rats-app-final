import { StorageService } from '../services/StorageService.js';
import { ExportService } from '../services/ExportService.js';
import { AuthService } from '../services/AuthService.js';

export class DesktopView {
    constructor() {
        if (window.innerWidth < 1024) return;

        this.leftCol = document.getElementById('desk-col-left');
        this.rightCol = document.getElementById('desk-col-right');

        this.selectedDate = new Date();
        this.tempExercises = [];

        this.init();
    }

    init() {
        // 1. Logo Clicável
        const logo = document.querySelector('.desk-logo');
        if (logo) logo.onclick = () => this.renderScreen1();

        // 2. Setup Login
        this.setupAuth();

        // 3. Renderiza Tela Inicial
        this.renderScreen1();
    }

    // =================================================================
    // SISTEMA DE AUTENTICAÇÃO E MODAL
    // =================================================================
    setupAuth() {
        const btnLogin = document.getElementById('desk-btn-login');

        AuthService.onStateChanged(async (user) => {
            if (user) {
                StorageService.setUserId(user.uid);

                // Tenta pegar perfil salvo ou usa dados do Google
                const profile = await StorageService.get('user_profile');
                let displayName = profile?.username || user.displayName || user.email.split('@')[0];

                // Trunca nome longo
                btnLogin.innerText = displayName.length > 20 ? displayName.substring(0, 20) + '...' : displayName;

                btnLogin.onclick = () => {
                    if (confirm("Deseja sair da conta?")) {
                        AuthService.logout();
                        window.location.reload();
                    }
                };
            } else {
                btnLogin.innerText = "Sign In/Log In";
                btnLogin.onclick = () => this.openAuthModal();
            }
        });

        this.createAuthModal();
    }

    createAuthModal() {
        if (document.getElementById('desk-auth-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'desk-modal-overlay';
        modal.id = 'desk-auth-modal';

        // Ícone SVG do Google para ficar profissional
        const googleIcon = `<svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill-rule="evenodd" fill-opacity="1" fill="#4285f4" stroke="none"></path><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.715H.957v2.332A8.997 8.997 0 0 0 9 18z" fill-rule="evenodd" fill-opacity="1" fill="#34a853" stroke="none"></path><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill-rule="evenodd" fill-opacity="1" fill="#fbbc05" stroke="none"></path><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill-rule="evenodd" fill-opacity="1" fill="#ea4335" stroke="none"></path></svg>`;

        modal.innerHTML = `
            <div class="desk-modal-box">
                <div class="desk-auth-tabs">
                    <button class="desk-tab active" id="tab-login">ENTRAR</button>
                    <button class="desk-tab" id="tab-register">REGISTRAR</button>
                </div>

                <div id="form-login-desk">
                    <button class="btn-desk btn-google" id="btn-google-login">
                        ${googleIcon} CONTINUAR COM GOOGLE
                    </button>
                    
                    <div class="auth-divider">OU USE SEU E-MAIL</div>

                    <label>E-MAIL</label>
                    <input type="email" id="login-email" placeholder="seu@email.com">
                    <label>SENHA</label>
                    <input type="password" id="login-pass" placeholder="******">
                    <button class="btn-desk btn-orange-2" id="btn-do-login">ACESSAR CONTA</button>
                </div>

                <div id="form-register-desk" style="display:none;">
                    <label>NOME DE USUÁRIO (Max 20)</label>
                    <input type="text" id="reg-username" maxlength="20" placeholder="Ex: JhenriquePro">
                    
                    <label>E-MAIL</label>
                    <input type="email" id="reg-email" placeholder="seu@email.com">
                    
                    <label>SENHA</label>
                    <input type="password" id="reg-pass" placeholder="Mínimo 6 caracteres">
                    
                    <button class="btn-desk btn-green" id="btn-do-register">CRIAR CONTA</button>
                </div>

                <div class="auth-error" id="auth-error-msg"></div>
                <button class="btn-desk btn-cancel" id="btn-close-auth-modal" style="margin-top:20px;">CANCELAR</button>
            </div>
        `;
        document.body.appendChild(modal);

        // --- EVENT LISTENERS ---

        // 1. Fechar
        const btnClose = document.getElementById('btn-close-auth-modal');
        if (btnClose) {
            btnClose.onclick = (e) => {
                e.preventDefault();
                modal.style.display = 'none';
                this.toggleAuthTab('login');
                document.getElementById('auth-error-msg').style.display = 'none';
            };
        }

        // 2. Login com Google (NOVO)
        document.getElementById('btn-google-login').onclick = async (e) => {
            e.preventDefault();
            try {
                // Chama o serviço existente (mesmo do mobile)
                await AuthService.loginWithGoogle();
                modal.style.display = 'none';
                // O onStateChanged cuidará do resto
            } catch (err) {
                console.error(err);
                const errorMsg = document.getElementById('auth-error-msg');
                errorMsg.innerText = "Erro ao conectar com Google.";
                errorMsg.style.display = 'block';
            }
        };

        // 3. Abas
        document.getElementById('tab-login').onclick = (e) => { e.preventDefault(); this.toggleAuthTab('login'); };
        document.getElementById('tab-register').onclick = (e) => { e.preventDefault(); this.toggleAuthTab('register'); };

        // 4. Ações Email/Senha
        document.getElementById('btn-do-login').onclick = (e) => { e.preventDefault(); this.handleLogin(); };
        document.getElementById('btn-do-register').onclick = (e) => { e.preventDefault(); this.handleRegister(); };
    }

    openAuthModal() {
        const modal = document.getElementById('desk-auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.toggleAuthTab('login');
            document.getElementById('auth-error-msg').style.display = 'none';
        }
    }

    toggleAuthTab(mode) {
        const formLogin = document.getElementById('form-login-desk');
        const formReg = document.getElementById('form-register-desk');
        const tabLogin = document.getElementById('tab-login');
        const tabReg = document.getElementById('tab-register');
        const errorMsg = document.getElementById('auth-error-msg');

        if (errorMsg) errorMsg.style.display = 'none';

        if (mode === 'login') {
            formLogin.style.display = 'block';
            formReg.style.display = 'none';
            tabLogin.classList.add('active');
            tabReg.classList.remove('active');
        } else {
            formLogin.style.display = 'none';
            formReg.style.display = 'block';
            tabLogin.classList.remove('active');
            tabReg.classList.add('active');
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const errorMsg = document.getElementById('auth-error-msg');

        if (!email || !pass) {
            errorMsg.innerText = "Preencha todos os campos.";
            errorMsg.style.display = 'block';
            return;
        }

        try {
            await AuthService.login(email, pass);
            document.getElementById('desk-auth-modal').style.display = 'none';
        } catch (e) {
            errorMsg.innerText = "Erro ao entrar: Verifique e-mail e senha.";
            errorMsg.style.display = 'block';
        }
    }

    async handleRegister() {
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const errorMsg = document.getElementById('auth-error-msg');

        if (!username) {
            errorMsg.innerText = "O nome de usuário é obrigatório.";
            errorMsg.style.display = 'block';
            return;
        }
        if (username.length > 20) {
            errorMsg.innerText = "O nome deve ter no máximo 20 caracteres.";
            errorMsg.style.display = 'block';
            return;
        }

        if (!email || !pass) {
            errorMsg.innerText = "Preencha todos os campos.";
            errorMsg.style.display = 'block';
            return;
        }

        try {
            const userCred = await AuthService.register(email, pass);

            StorageService.setUserId(userCred.user.uid);
            await StorageService.save('user_profile', {
                username: username,
                email: email,
                created_at: new Date().toISOString()
            });

            document.getElementById('desk-auth-modal').style.display = 'none';
            alert("Conta criada com sucesso!");

            // Atualiza visualmente
            document.getElementById('desk-btn-login').innerText = username;

        } catch (e) {
            console.error(e);
            let msg = "Erro ao registrar.";
            if (e.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
            if (e.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";

            errorMsg.innerText = msg;
            errorMsg.style.display = 'block';
        }
    }


    // =================================================================
    // TELA 1: INICIAL
    // =================================================================
    renderScreen1() {
        this.leftCol.innerHTML = `
            <div class="section-title">CALENDÁRIO</div>
            <div class="desk-card">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <select id="d-month" class="desk-input"></select>
                    <select id="d-year" class="desk-input"></select>
                </div>
                <div id="desk-calendar-grid" class="desk-cal-grid"></div>
                <p class="desk-instruction">(ESCOLHA UMA DATA PARA VISUALIZAR)</p>
            </div>
        `;

        this.populateCalendarSelects();
        this.setupCalendar();
        this.updateDashboardRight(this.selectedDate);
    }

    populateCalendarSelects() {
        const selMonth = document.getElementById('d-month');
        const selYear = document.getElementById('d-year');
        if (!selMonth || !selYear) return;

        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        selMonth.innerHTML = '';
        months.forEach((m, i) => {
            const opt = document.createElement('option');
            opt.value = i; opt.innerText = m;
            if (i === this.selectedDate.getMonth()) opt.selected = true;
            selMonth.appendChild(opt);
        });

        selYear.innerHTML = '';
        for (let y = 2025; y <= 2030; y++) {
            const opt = document.createElement('option');
            opt.value = y; opt.innerText = y;
            if (y === this.selectedDate.getFullYear()) opt.selected = true;
            selYear.appendChild(opt);
        }

        const update = () => {
            this.selectedDate.setMonth(parseInt(selMonth.value));
            this.selectedDate.setFullYear(parseInt(selYear.value));
            this.setupCalendar();
        };
        selMonth.onchange = update;
        selYear.onchange = update;
    }

    updateDashboardRight(date) {
        const dateStr = date.toDateString();
        const history = StorageService.get('gym_rats_history') || [];
        const workoutEntry = history.find(h => h.dateString === dateStr);
        const templates = StorageService.get('gym_rats_templates') || [];
        const hasTemplates = templates.length > 0;

        const editBtnHtml = hasTemplates
            ? `<button class="btn-desk btn-orange-2" id="btn-go-edit">EDITAR PLANO DE<br>TREINO EXISTENTE</button>`
            : `<button class="btn-desk btn-orange-2" style="opacity:0.5; cursor:not-allowed;">EDITAR PLANO DE<br>TREINO EXISTENTE</button>`;

        this.rightCol.innerHTML = `<div class="section-title">DASHBOARD</div>`;

        if (!workoutEntry) {
            this.rightCol.innerHTML += `
                <div class="desk-card" style="justify-content:center; align-items:center;">
                    <h3 style="color:#666; margin-bottom:10px; font-size:1.5rem;">NÃO HÁ REGISTROS PARA ESSA DATA</h3>
                    <p style="color:#444;">Para carregar as informações você precisa ter realizado um treino.</p>
                </div>
                <div class="grid-btns">
                    <button class="btn-desk btn-orange-1" id="btn-go-create">REGISTRAR NOVO<br>PLANO DE TREINO</button>
                    ${editBtnHtml}
                </div>
                <p class="desk-instruction">(INFORMAÇÕES ESPECÍFICAS)</p>
            `;
        } else {
            const fullLogs = StorageService.get('gym_rats_full_logs') || [];
            const details = fullLogs.find(w => w.id === workoutEntry.id);
            const totalVol = details ? details.exercises.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + (s.weight * s.reps || 0), 0), 0) : 0;
            const totalSets = details ? details.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) : 0;
            const duration = this.calculateDuration(details?.startTime, details?.endTime);

            this.rightCol.innerHTML += `
                <div class="desk-card">
                    <div class="dash-row"><span class="dash-label">Treino:</span> <span class="dash-value">"${workoutEntry.name}"</span></div>
                    <div class="dash-row"><span class="dash-label">Data:</span> <span class="dash-value">"${date.toLocaleDateString('pt-BR')}"</span></div>
                    <div class="dash-row"><span class="dash-label">Qtd. Exercícios:</span> <span class="dash-value">"${details?.exercises.length || 0}"</span></div>
                    <div class="dash-row"><span class="dash-label">Duração total:</span> <span class="dash-value">"${duration}"</span></div>
                    <div class="dash-row"><span class="dash-label">Séries totais:</span> <span class="dash-value">"${totalSets}"</span></div>
                    <div class="dash-row"><span class="dash-label">Volume de Treino:</span> <span class="dash-value">"${totalVol.toLocaleString()} kg"</span></div>
                    
                    <button class="btn-desk btn-blue" id="btn-go-details" style="margin-top:30px;">Ver mais detalhes do treino aqui.</button>
                </div>
                <div class="grid-btns">
                    <button class="btn-desk btn-orange-1" id="btn-go-create">REGISTRAR NOVO<br>PLANO DE TREINO</button>
                    ${editBtnHtml}
                </div>
                <p class="desk-instruction">(INFORMAÇÕES ESPECÍFICAS)</p>
            `;
            document.getElementById('btn-go-details').onclick = () => this.renderScreen2(workoutEntry.id);
        }

        if (document.getElementById('btn-go-create')) document.getElementById('btn-go-create').onclick = () => this.renderScreen3();
        if (hasTemplates && document.getElementById('btn-go-edit')) document.getElementById('btn-go-edit').onclick = () => this.renderScreen4();
    }

    // =================================================================
    // TELA 2: DETALHES
    // =================================================================
    renderScreen2(workoutId) {
        const fullLogs = StorageService.get('gym_rats_full_logs') || [];
        fullLogs.sort((a, b) => new Date(a.dateISO) - new Date(b.dateISO));

        const currentIndex = fullLogs.findIndex(w => w.id === workoutId);
        const currentWorkout = fullLogs[currentIndex];

        if (!currentWorkout) return this.renderScreen1();

        this.leftCol.innerHTML = `
            <div class="section-title">DASHBOARD</div>
            <div class="desk-card">
                <div class="dash-row"><span class="dash-label">Treino:</span> <span class="dash-value">"${currentWorkout.name}"</span></div>
                <div class="dash-row"><span class="dash-label">Data:</span> <span class="dash-value">"${new Date(currentWorkout.dateISO + 'T12:00:00').toLocaleDateString('pt-BR')}"</span></div>
                <div class="dash-row"><span class="dash-label">Qtd. Exercícios:</span> <span class="dash-value">"${currentWorkout.exercises.length}"</span></div>
                <div class="dash-row"><span class="dash-label">Séries totais:</span> <span class="dash-value">"${currentWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0)}"</span></div>

                <div class="grid-btns" style="margin-top:auto;">
                    <button class="btn-desk btn-orange-1" id="btn-prev">TREINO<br>ANTERIOR</button>
                    <button class="btn-desk btn-orange-2" id="btn-next">PRÓXIMO<br>TREINO</button>
                </div>
                <p class="desk-instruction">(INFORMAÇÕES ESPECÍFICAS)</p>
            </div>
        `;

        document.getElementById('btn-prev').onclick = () => {
            if (currentIndex > 0) this.renderScreen2(fullLogs[currentIndex - 1].id);
            else alert("Este é o primeiro treino registrado.");
        };
        document.getElementById('btn-next').onclick = () => {
            if (currentIndex < fullLogs.length - 1) this.renderScreen2(fullLogs[currentIndex + 1].id);
            else alert("Este é o último treino registrado.");
        };

        let htmlRight = `<div class="section-title">EXERCÍCIOS</div><div class="desk-card">`;
        currentWorkout.exercises.forEach(ex => {
            const setsStr = ex.sets.map(s => `${s.weight}kg x ${s.reps}`).join(' | ');
            htmlRight += `
                <div class="desk-ex-item" style="flex-direction:column; align-items:flex-start;">
                    <div style="width:100%; display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span class="desk-ex-name">${ex.name}</span>
                    </div>
                    <div style="color:#aaa; font-size:0.9rem; font-family:monospace;">
                        ${setsStr}
                    </div>
                </div>
            `;
        });

        htmlRight += `
            <div style="margin-top:auto;"><button class="btn-desk btn-green" id="btn-pdf">DOWNLOAD PDF</button></div>
            <p class="desk-instruction">(INFORMAÇÕES DETALHADAS)</p>
        </div>`;

        this.rightCol.innerHTML = htmlRight;
        document.getElementById('btn-pdf').onclick = () => ExportService.exportToPDF(currentWorkout, `Treino_${currentWorkout.dateISO}`);
    }

    // =================================================================
    // TELA 3: REGISTRAR NOVO
    // =================================================================
    renderScreen3() {
        this.tempExercises = [];

        this.leftCol.innerHTML = `
            <div class="section-title">NOVO PLANO</div>
            <div class="desk-card">
                <label class="desk-label">NOME DO TREINO</label>
                <input type="text" id="inp-d-name" class="desk-input" placeholder="Ex: Treino A - Superiores">
                
                <label class="desk-label" style="margin-top:20px; border-top:1px solid #333; padding-top:20px;">ADICIONAR EXERCÍCIO</label>
                <input type="text" id="inp-d-exname" class="desk-input" placeholder="Ex: Supino Reto">
                
                <div style="display:flex; gap:10px;">
                    <input type="number" id="inp-d-sets" class="desk-input" placeholder="Qtd. Séries" style="width:100px;" min="1">
                    <input type="text" id="inp-d-obs" class="desk-input" placeholder="Observações">
                </div>

                <div style="margin-top:auto;">
                    <button class="btn-desk btn-orange-2" id="btn-add-list">+ INCLUIR NA LISTA</button>
                    <button class="btn-desk btn-cancel" id="btn-cancel-create" style="margin-top:15px;">CANCELAR</button>
                </div>
            </div>
        `;

        this.rightCol.innerHTML = `
            <div class="section-title">EXERCÍCIOS</div>
            <div class="desk-card">
                <div id="desk-preview-list"><p style="text-align:center; color:#666;">Nenhum exercício adicionado.</p></div>
                
                <div style="margin-top:auto;">
                    <button class="btn-desk btn-green" id="btn-save-new" style="display:none;">SALVAR TREINO</button>
                </div>
            </div>
        `;

        document.getElementById('btn-add-list').onclick = () => this.addExerciseToTemp();
        document.getElementById('btn-save-new').onclick = () => this.saveNewWorkout();
        document.getElementById('btn-cancel-create').onclick = () => this.renderScreen1();
    }

    addExerciseToTemp() {
        const name = document.getElementById('inp-d-exname').value;
        const setsVal = document.getElementById('inp-d-sets').value;
        const obs = document.getElementById('inp-d-obs').value;

        const sets = parseInt(setsVal);
        if (!name || !sets) return alert("Preencha nome e séries.");
        if (sets <= 0) return alert("A quantidade de séries deve ser maior que zero.");

        this.tempExercises.push({ name, sets, observations: obs });

        document.getElementById('inp-d-exname').value = '';
        document.getElementById('inp-d-sets').value = '';
        document.getElementById('inp-d-obs').value = '';
        document.getElementById('inp-d-exname').focus();

        this.renderPreviewList();
    }

    renderPreviewList() {
        const container = document.getElementById('desk-preview-list');
        const btnSave = document.getElementById('btn-save-new');

        if (this.tempExercises.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666;">Nenhum exercício adicionado.</p>';
            btnSave.style.display = 'none';
            return;
        }

        let html = '';
        this.tempExercises.forEach((ex, idx) => {
            html += `
                <div class="desk-ex-item">
                    <div style="flex:1;">
                        <strong style="color:#D8D8D8; display:block;">${ex.name}</strong>
                        <div style="display:flex; justify-content:space-between; width:100%; margin-top:5px;">
                            <small style="color:#888;">${ex.sets} Séries</small>
                            <small style="color:#666; font-style:italic; margin-right:10px;">${ex.observations || ''}</small>
                        </div>
                    </div>
                    <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="window.removeDeskItem(${idx})">🗑️</button>
                </div>
            `;
        });
        container.innerHTML = html;
        btnSave.style.display = 'block';

        window.removeDeskItem = (idx) => {
            this.tempExercises.splice(idx, 1);
            this.renderPreviewList();
        };
    }

    saveNewWorkout() {
        const name = document.getElementById('inp-d-name').value;
        if (!name) return alert("Dê um nome ao treino.");

        const templates = StorageService.get('gym_rats_templates') || [];
        templates.push({ id: Date.now(), name: name, exercises: this.tempExercises });
        StorageService.save('gym_rats_templates', templates);

        alert("Treino Salvo!");
        this.renderScreen1();
    }

    // =================================================================
    // TELA 4: EDITAR
    // =================================================================
    renderScreen4() {
        const templates = StorageService.get('gym_rats_templates') || [];
        this.editingTemplateId = null;

        let options = `<option value="">Selecionar treino existente.</option>`;
        templates.forEach(t => options += `<option value="${t.id}">${t.name}</option>`);

        this.leftCol.innerHTML = `
            <div class="section-title">EDITAR PLANO</div>
            <div class="desk-card">
                <label class="desk-label">ESCOLHER TREINO</label>
                <select id="sel-edit-tpl" class="desk-input">${options}</select>
                
                <div id="edit-area" style="display:none; margin-top:20px; border-top:1px solid #333; padding-top:20px;">
                    <label class="desk-label" style="color:#ff4500;">EDITAR EXERCÍCIO</label>
                    <input type="text" id="edit-ex-name" class="desk-input">
                    <div style="display:flex; gap:10px;">
                        <input type="number" id="edit-ex-sets" class="desk-input" style="width:100px;" min="1">
                        <input type="text" id="edit-ex-obs" class="desk-input" placeholder="Obs">
                    </div>
                    <button class="btn-desk btn-orange-2" id="btn-update-item">+ ALTERAR NA LISTA</button>
                </div>

                <div style="margin-top:auto; display:flex; gap:15px; flex-direction: column;">
                     <button class="btn-desk btn-red" id="btn-delete-tpl" style="display:none;">DELETAR TREINO</button>
                     <button class="btn-desk btn-cancel" id="btn-cancel-edit">CANCELAR</button>
                </div>
            </div>
        `;

        this.rightCol.innerHTML = `
            <div class="section-title">EXERCÍCIOS</div>
            <div class="desk-card" id="right-edit-card">
                <p style="text-align:center; color:#666;">Selecione um treino na esquerda.</p>
            </div>
        `;

        document.getElementById('btn-cancel-edit').onclick = () => this.renderScreen1();

        const select = document.getElementById('sel-edit-tpl');
        select.addEventListener('change', () => {
            this.editingTemplateId = parseInt(select.value);
            const template = templates.find(t => t.id === this.editingTemplateId);

            if (template) {
                this.tempExercises = JSON.parse(JSON.stringify(template.exercises));
                this.renderEditList();
                document.getElementById('btn-delete-tpl').style.display = 'block';
            } else {
                this.tempExercises = [];
                this.renderEditList();
                document.getElementById('btn-delete-tpl').style.display = 'none';
            }
        });

        document.getElementById('btn-delete-tpl').onclick = () => {
            if (confirm("Deseja mesmo deletar o treino?")) {
                const newTpls = templates.filter(t => t.id !== this.editingTemplateId);
                StorageService.save('gym_rats_templates', newTpls);
                this.renderScreen1();
            }
        };

        document.getElementById('btn-update-item').onclick = () => {
            if (this.editingItemIndex === null) return;
            const sets = parseInt(document.getElementById('edit-ex-sets').value);
            if (sets <= 0) return alert("Séries > 0");

            this.tempExercises[this.editingItemIndex].name = document.getElementById('edit-ex-name').value;
            this.tempExercises[this.editingItemIndex].sets = sets;
            this.tempExercises[this.editingItemIndex].observations = document.getElementById('edit-ex-obs').value;

            this.renderEditList();
            document.getElementById('edit-area').style.display = 'none';
        };
    }

    renderEditList() {
        const container = document.getElementById('right-edit-card');

        if (!this.editingTemplateId) {
            container.innerHTML = `<p style="text-align:center; color:#666;">Selecione um treino na esquerda.</p>`;
            return;
        }

        let html = '';
        this.tempExercises.forEach((ex, idx) => {
            html += `
                <div class="desk-ex-item">
                    <div style="flex:1;">
                        <strong style="color:#D8D8D8;">${ex.name}</strong>
                        <div style="display:flex; justify-content:space-between; width:100%; margin-top:5px;">
                            <small style="color:#888;">${ex.sets} Séries</small>
                            <small style="color:#666; font-style:italic; margin-right:10px;">${ex.observations || ''}</small>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button style="background:none; border:none; font-size:1.2rem; cursor:pointer;" onclick="window.editDeskItem(${idx})">✏️</button>
                        <button style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#CC0000;" onclick="window.removeEditItem(${idx})">🗑️</button>
                    </div>
                </div>
            `;
        });

        html += `<div style="margin-top:auto;"><button class="btn-desk btn-green" onclick="window.saveEditedTemplate()">SALVAR EDIÇÃO</button></div>`;
        container.innerHTML = html;

        window.editDeskItem = (idx) => {
            this.editingItemIndex = idx;
            const ex = this.tempExercises[idx];
            document.getElementById('edit-area').style.display = 'block';
            document.getElementById('edit-ex-name').value = ex.name;
            document.getElementById('edit-ex-sets').value = ex.sets;
            document.getElementById('edit-ex-obs').value = ex.observations || '';
        };

        window.removeEditItem = (idx) => {
            this.tempExercises.splice(idx, 1);
            this.renderEditList();
        };

        window.saveEditedTemplate = () => {
            const templates = StorageService.get('gym_rats_templates') || [];
            const tIndex = templates.findIndex(t => t.id === this.editingTemplateId);
            if (tIndex !== -1) {
                templates[tIndex].exercises = this.tempExercises;
                StorageService.save('gym_rats_templates', templates);
                alert("Edição Salva!");
                this.renderScreen1();
            }
        };
    }

    setupCalendar() {
        const grid = document.getElementById('desk-calendar-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const history = StorageService.get('gym_rats_history') || [];
        const workoutDates = new Set(history.map(h => h.dateString));

        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const firstDay = new Date(year, month, 1).getDay();
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const checkDate = new Date(year, month, i).toDateString();

            let cls = 'desk-day';
            if (workoutDates.has(checkDate)) cls += ' active';

            const currentSelStr = this.selectedDate.toDateString();
            const thisDayStr = new Date(year, month, i).toDateString();
            if (currentSelStr === thisDayStr) cls += ' selected';

            const dayDiv = document.createElement('div');
            dayDiv.className = cls;
            dayDiv.innerText = i;
            dayDiv.onclick = () => {
                this.selectedDate = new Date(year, month, i);
                this.renderScreen1();
            };
            grid.appendChild(dayDiv);
        }
    }

    calculateDuration(start, end) {
        if (!start || !end) return "--";
        const diff = end - start;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
    }
}