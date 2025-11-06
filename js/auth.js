/**
 * SAA - Sistema de Gestão Discente
 * Sistema de Autenticação e Autorização
 * Versão: 1.0.0
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    // --- Hashing e validação ---
    // Nota: para produção, use bcrypt/argon2 no servidor. Aqui usamos um salt simples + base64 por demo.
    hashPassword(password) {
        try {
            return btoa(password + 'SAA_SALT_2025');
        } catch (e) {
            return password;
        }
    }

    validatePassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }

    init() {
        // Inicializar usuários padrão se não existirem
        if (!localStorage.getItem('saa_users')) {
            this.createDefaultUsers();
        }

        // Verificar se usuário está logado
        this.checkLoggedIn();

        // Configurar formulário de login
        this.setupLoginForm();
    }

    // Cria usuários padrão com senhas temporárias (hash)
    createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin.saa',
                password: this.hashPassword('Adm@SAA2025'),
                nome: 'Administrador Sistema',
                email: 'admin@institucional.edu.br',
                tipo: 'admin',
                permissoes: ['*'],
                ativo: true,
                dataCriacao: new Date().toISOString(),
                senhaTemporaria: true
            },
            {
                id: 2,
                username: 'coord.saa',
                password: this.hashPassword('Coord@SAA2025'),
                nome: 'Coordenador Pedagógico',
                email: 'coordenacao@institucional.edu.br',
                tipo: 'coordenador',
                permissoes: [
                    'alunos.ver', 'alunos.editar',
                    'ocorrencias.*',
                    'processos.*',
                    'relatorios.ver',
                    'notificacoes.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString(),
                senhaTemporaria: true
            },
            {
                id: 3,
                username: 'prof.saa',
                password: this.hashPassword('Prof@SAA2025'),
                nome: 'Professor',
                email: 'docente@institucional.edu.br',
                tipo: 'professor',
                permissoes: [
                    'alunos.ver',
                    'ocorrencias.criar', 'ocorrencias.ver',
                    'processos.ver',
                    'notificacoes.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString(),
                senhaTemporaria: true
            },
            {
                id: 4,
                username: 'sec.saa',
                password: this.hashPassword('Sec@SAA2025'),
                nome: 'Secretaria Acadêmica',
                email: 'secretaria@institucional.edu.br',
                tipo: 'secretaria',
                permissoes: [
                    'alunos.*',
                    'ocorrencias.ver',
                    'processos.ver',
                    'relatorios.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString(),
                senhaTemporaria: true
            }
        ];

        localStorage.setItem('saa_users', JSON.stringify(defaultUsers));
    }

    // Recria os usuários padrão (útil para reset em ambiente de dev)
    resetDefaultUsers() {
        localStorage.removeItem('saa_users');
        this.createDefaultUsers();
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });

            // Carregar informações de suporte do config (se disponível)
            fetch('config/system-config.json')
                .then(response => response.json())
                .then(config => {
                    if (config && config.suporte) {
                        const { telefone, email, horarioAtendimento, diasAtendimento } = config.suporte;
                        const telEl = document.getElementById('suporteTelefone');
                        const mailEl = document.getElementById('suporteEmail');
                        const horarioEl = document.getElementById('suporteHorario');
                        if (telEl) telEl.innerHTML = `<strong>Telefone:</strong> ${telefone}`;
                        if (mailEl) mailEl.innerHTML = `<strong>Email:</strong> ${email}`;
                        if (horarioEl) horarioEl.innerHTML = `<strong>Horário:</strong> ${horarioAtendimento} (${diasAtendimento})`;
                    }
                })
                .catch(() => {});

            // Password strength feedback
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('input', (e) => {
                    this.updatePasswordStrength(e.target.value);
                });
            }
        }
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn ? loginBtn.innerHTML : 'Entrando...';

        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando...';
            loginBtn.disabled = true;
        }

        setTimeout(() => {
            const user = this.authenticate(username, password);
            if (user) {
                // If temporary password, force change before redirect
                if (user.senhaTemporaria) {
                    // Store temp session data and open modal
                    sessionStorage.setItem('saa_pending_user', JSON.stringify({ userId: user.id, rememberMe }));
                    this.showChangePasswordModal();
                    if (loginBtn) { loginBtn.innerHTML = originalText; loginBtn.disabled = false; }
                    return;
                }

                this.login(user, rememberMe);
                this.redirectToApp();
            } else {
                this.showError('Usuário ou senha inválidos');
                if (loginBtn) { loginBtn.innerHTML = originalText; loginBtn.disabled = false; }
            }
        }, 800);
    }

    // Authenticate accepts a raw password and compares hashed values.
    authenticate(username, password) {
        const users = JSON.parse(localStorage.getItem('saa_users')) || [];
        const hashed = this.hashPassword(password);

        return users.find(user => {
            if (!user || !user.ativo) return false;
            // If stored password appears hashed (we stored as btoa with salt) compare hashes
            if (user.password === hashed) return user.username === username;
            // Backward compatibility: stored plaintext
            if (user.password === password) return user.username === username;
            return false;
        });
    }

    login(user, rememberMe = false) {
        this.currentUser = user;

        const sessionData = {
            user: user,
            timestamp: new Date().getTime(),
            rememberMe: rememberMe
        };

        if (rememberMe) {
            localStorage.setItem('saa_session', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('saa_session', JSON.stringify(sessionData));
        }

        this.registrarLogAcesso(user);
        console.log(`✅ Usuário ${user.nome} logado com sucesso`);
    }

    logout() {
        console.log(`👋 Usuário ${this.currentUser?.nome} deslogado`);
        this.currentUser = null;
        localStorage.removeItem('saa_session');
        sessionStorage.removeItem('saa_session');
        window.location.href = 'login.html';
    }

    checkLoggedIn() {
        let sessionData = sessionStorage.getItem('saa_session') || localStorage.getItem('saa_session');
        if (sessionData) {
            sessionData = JSON.parse(sessionData);

            const sessionAge = new Date().getTime() - sessionData.timestamp;
            const eightHours = 8 * 60 * 60 * 1000;

            if (sessionAge < eightHours) {
                this.currentUser = sessionData.user;
                if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
                    this.redirectToApp();
                }
            } else {
                this.logout();
            }
        } else if (!window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
            window.location.href = 'login.html';
        }
    }

    redirectToApp() {
        window.location.href = 'index.html';
    }

    showError(message) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) existingAlert.remove();

        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const loginCard = document.querySelector('.login-card');
        if (loginCard) loginCard.insertBefore(alert, loginCard.firstChild);

        setTimeout(() => { if (alert.parentNode) alert.remove(); }, 5000);
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        if (this.currentUser.permissoes.includes('*')) return true;
        if (this.currentUser.permissoes.includes(permission)) return true;
        const parts = permission.split('.');
        if (parts.length === 2) {
            const wildcard = `${parts[0]}.*`;
            if (this.currentUser.permissoes.includes(wildcard)) return true;
        }
        return false;
    }

    getUserInfo() { return this.currentUser; }

    registrarLogAcesso(user) {
        const logs = JSON.parse(localStorage.getItem('saa_access_logs')) || [];
        logs.push({ userId: user.id, username: user.username, tipo: user.tipo, dataAcesso: new Date().toISOString(), ip: 'localhost' });
        localStorage.setItem('saa_access_logs', JSON.stringify(logs));
    }

    // quickLogin deixou-se no código para ambientes de dev, mas não há botões na UI
    quickLogin(tipo) {
        const users = JSON.parse(localStorage.getItem('saa_users')) || [];
        const user = users.find(u => u.tipo === tipo);
        if (user) {
            document.getElementById('username').value = user.username;
            // Não preenche senha por segurança
            document.getElementById('rememberMe').checked = true;
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
    }

    // Gerenciamento de usuários
    getUsers() { return JSON.parse(localStorage.getItem('saa_users')) || []; }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = { id: Date.now(), ...userData, dataCriacao: new Date().toISOString(), ativo: true };
        users.push(newUser);
        localStorage.setItem('saa_users', JSON.stringify(users));
        return newUser;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx !== -1) {
            users[idx] = { ...users[idx], ...updates };
            localStorage.setItem('saa_users', JSON.stringify(users));
            if (this.currentUser && this.currentUser.id === userId) this.currentUser = users[idx];
            return users[idx];
        }
        return null;
    }

    // Change password from code (compares hashed values)
    changePassword(userId, currentPassword, newPassword) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return { success: false, message: 'Usuário não encontrado' };

        const currentHash = this.hashPassword(currentPassword);
        // allow legacy plaintext
        if (user.password !== currentHash && user.password !== currentPassword) {
            return { success: false, message: 'Senha atual incorreta' };
        }

        if (!this.validatePassword(newPassword)) {
            return { success: false, message: 'Nova senha não atende os requisitos de segurança' };
        }

        user.password = this.hashPassword(newPassword);
        user.senhaTemporaria = false;
        localStorage.setItem('saa_users', JSON.stringify(users));
        return { success: true, message: 'Senha alterada com sucesso' };
    }

    // UI: abrir modal de alteração de senha (modal presente em login.html)
    showChangePasswordModal() {
        const modalEl = document.getElementById('changePasswordModal');
        if (!modalEl) return;
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    // Handler para submissão do modal de alteração de senha
    async handleChangePasswordFromModal() {
        const current = document.getElementById('changeCurrentPassword').value;
        const next = document.getElementById('changeNewPassword').value;
        const confirm = document.getElementById('changeConfirmPassword').value;

        if (next !== confirm) {
            this.showError('A nova senha e a confirmação não coincidem.');
            return;
        }

        const pending = JSON.parse(sessionStorage.getItem('saa_pending_user')) || null;
        if (!pending) {
            this.showError('Dados de usuário pendentes não encontrados. Faça login novamente.');
            return;
        }

        const result = this.changePassword(pending.userId, current, next);
        if (result.success) {
            // Limpar pending e realizar login automático
            sessionStorage.removeItem('saa_pending_user');
            const users = this.getUsers();
            const user = users.find(u => u.id === pending.userId);
            if (user) {
                this.login(user, pending.rememberMe);
                // Fechar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                if (modal) modal.hide();
                this.redirectToApp();
            }
        } else {
            this.showError(result.message);
        }
    }

    // Feedback visual de força da senha
    updatePasswordStrength(password) {
        const strengthDiv = document.getElementById('passwordStrength');
        if (!strengthDiv) return;
        const minLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[@$!%*?&]/.test(password);
        const score = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
        let msg = 'Muito fraca', color = 'danger';
        if (score === 2) { msg = 'Fraca'; color = 'warning'; }
        if (score === 3) { msg = 'Média'; color = 'info'; }
        if (score === 4) { msg = 'Forte'; color = 'primary'; }
        if (score === 5) { msg = 'Muito forte'; color = 'success'; }
        strengthDiv.innerHTML = `<small class="text-${color}"><i class="fas fa-shield-alt me-1"></i>Força: ${msg}</small>`;
    }
}

// Funções globais
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const passwordIcon = document.getElementById('passwordIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        passwordIcon.className = 'fas fa-eye-slash';
    } else {
        passwordInput.type = 'password';
        passwordIcon.className = 'fas fa-eye';
    }
}

function showForgotPassword() {
    const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    modal.show();
}

// Inicializar sistema de auth
const auth = new AuthSystem();

// Conectar modal submit (se existir)
document.addEventListener('DOMContentLoaded', () => {
    const changeFormBtn = document.getElementById('changePasswordSubmit');
    if (changeFormBtn) {
        changeFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.handleChangePasswordFromModal();
        });
    }
});
