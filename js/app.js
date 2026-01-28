import { DesktopView } from './views/DesktopView.js';
import { LogWorkoutView } from './views/LogWorkoutView.js';
import { CreateWorkoutView } from './views/CreateWorkoutView.js';
import { DashboardView } from './views/DashboardView.js';
import { RecordsView } from './views/RecordsView.js';
import { AuthService } from './services/AuthService.js';
import { StorageService } from './services/StorageService.js';

document.addEventListener('DOMContentLoaded', () => {

    if (window.innerWidth >= 1024) {
        console.log("Iniciando Modo Desktop...");
        new DesktopView();
    }

    // --- 1. Referências Globais ---
    const btnProfile = document.getElementById('btn-user-profile');
    const modalLogin = document.getElementById('modal-login');
    const formLogin = document.getElementById('form-login');
    const btnGoogle = document.getElementById('btn-google-login');
    const btnCloseLogin = document.getElementById('btn-close-login');
    const profileIconText = btnProfile.querySelector('.icon');

    const sections = document.querySelectorAll('.view-section');
    const modalSelect = document.getElementById('modal-select-workout');
    const listSaved = document.getElementById('list-saved-workouts');

    // --- 2. Estado ---
    let currentUser = null;

    // --- 3. Inicialização das Views ---
    const logWorkoutView = new LogWorkoutView();
    const createWorkoutView = new CreateWorkoutView();
    const recordsView = new RecordsView();
    let dashboardView = null; // Inicializado após Auth

    // --- 4. Lógica de Autenticação ---

    // Escuta mudanças de estado (Login/Logout)
    AuthService.onStateChanged(async (user) => { // Note o ASYNC aqui
        currentUser = user;

        if (user) {
            // USUÁRIO LOGADO
            const initial = user.email ? user.email[0].toUpperCase() : 'U';
            profileIconText.innerText = initial;
            btnProfile.style.borderColor = 'var(--color-primary)';

            // 1. Configura ID
            StorageService.setUserId(user.uid);

            // 2. [NOVO] Baixa dados da nuvem
            // Mostra um aviso visual simples (opcional) ou apenas log
            console.log("Buscando dados na nuvem...");
            await StorageService.syncFromCloud(); 
            
        } else {
            // USUÁRIO DESLOGADO
            profileIconText.innerText = 'Log In';
            btnProfile.style.borderColor = 'var(--color-border)';
            profileIconText.style.fontSize = '0.6rem';

            StorageService.setUserId(null);
        }

        // 3. Recarrega o Dashboard (agora com dados atualizados da nuvem)
        dashboardView = new DashboardView();
        
        // Se estiver na tela de Histórico ou Criar Treino, recarregar elas também seria ideal
        // mas o Dashboard é o principal.
    });

    // Eventos de Login
    btnProfile.addEventListener('click', () => {
        if (currentUser) {
            if (confirm(`Logado como ${currentUser.email}.\nDeseja sair?`)) AuthService.logout();
        } else {
            modalLogin.showModal();
        }
    });

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await AuthService.loginEmail(document.getElementById('inp-email').value, document.getElementById('inp-password').value);
            modalLogin.close();
        } catch (error) { alert("Erro no login: " + error.message); }
    });

    btnGoogle.addEventListener('click', async () => {
        try {
            await AuthService.loginGoogle();
            modalLogin.close();
        } catch (error) { alert("Erro no login Google."); }
    });

    btnCloseLogin.addEventListener('click', () => modalLogin.close());

    // --- 5. Navegação SPA (Single Page Application) ---
    function navigateTo(targetId) {
        // Esconde todas
        sections.forEach(sec => sec.classList.add('hidden'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

        // Mostra alvo
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('hidden');

            // Correção de Rolagem (Scroll Fix)
            setTimeout(() => {
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;

                const header = targetSection.querySelector('.view-header');
                if (header) header.scrollIntoView(true);
            }, 10);
        }
    }

    // Listener Global de Navegação (Botões data-target)
    document.querySelectorAll('[data-target]').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.getAttribute('data-target'));
        });
    });

    // --- 6. Lógica do Dashboard & Treinos ---

    document.getElementById('btn-start-selection').addEventListener('click', () => {
        populateWorkoutList();
        modalSelect.showModal();
    });

    document.getElementById('btn-close-selection').addEventListener('click', () => modalSelect.close());

    // Preenche a lista de treinos salvos no Modal
    function populateWorkoutList() {
        const templates = StorageService.get('gym_rats_templates') || [];
        listSaved.innerHTML = '';

        if (templates.length === 0) {
            listSaved.innerHTML = `<p style="text-align:center; padding: 20px; color: #888;">Nenhum treino criado.</p>`;
            return;
        }

        templates.forEach(template => {
            const itemRow = document.createElement('div');
            itemRow.className = 'template-item';

            itemRow.innerHTML = `
                <button class="template-info-btn">
                    <strong>${template.name}</strong> 
                    <span style="font-size:0.8em; color: #888; margin-left: 5px;">(${template.exercises.length} ex)</span>
                </button>
                <div class="template-actions">
                    <button class="btn-icon-action btn-edit" title="Editar">✏️</button>
                    <button class="btn-icon-action btn-delete" title="Excluir">🗑️</button>
                </div>
            `;

            // Ação: Iniciar
            itemRow.querySelector('.template-info-btn').addEventListener('click', () => {
                modalSelect.close();
                startWorkout(template);
            });

            // Ação: Editar
            itemRow.querySelector('.btn-edit').addEventListener('click', (e) => {
                e.stopPropagation();
                modalSelect.close();
                navigateTo('view-create-workout');
                createWorkoutView.loadTemplateForEditing(template);
            });

            // Ação: Excluir
            itemRow.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Apagar "${template.name}"?`)) {
                    const updated = templates.filter(t => t.id !== template.id);
                    StorageService.save('gym_rats_templates', updated);
                    populateWorkoutList();
                }
            });

            listSaved.appendChild(itemRow);
        });
    }

    function startWorkout(template) {
        navigateTo('view-log-workout');
        logWorkoutView.startNewSession(template);
    }
});