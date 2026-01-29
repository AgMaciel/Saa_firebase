/**
 * SAA - Sistema de Gestão Discente
 * Sistema de Autenticação e Autorização
 * Versão: 1.0.0
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.auth = firebase.auth();
        this.restoreSession(); // Tenta restaurar sessão síncrona
        this.init();
    }

    restoreSession() {
        try {
            const sessionData = sessionStorage.getItem('saa_session') || localStorage.getItem('saa_session');
            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                // Validar timestamp (8 horas)
                const sessionAge = new Date().getTime() - parsed.timestamp;
                const eightHours = 8 * 60 * 60 * 1000;

                if (sessionAge < eightHours) {
                    this.currentUser = parsed.user;
                    console.log('🔄 Sessão restaurada localmente:', this.currentUser.email);
                } else {
                    this.clearSession();
                }
            }
        } catch (e) {
            console.error('Erro ao restaurar sessão:', e);
        }
    }

    init() {
        // Monitorar estado de autenticação
        this.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        // Configurar formulário de login
        this.setupLoginForm();
    }

    handleAuthStateChange(firebaseUser) {
        if (firebaseUser) {
            console.log('👤 Usuário Firebase detectado:', firebaseUser.email);

            // Sincronizar/Buscar dados do usuário no Firestore/LocalStorage
            this.syncUserWithDatabase(firebaseUser).then(appUser => {
                this.currentUser = appUser;
                this.saveSession(appUser);

                // Se estiver na tela de login, redirecionar
                if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
                    console.log('🔀 Redirecionando para dashboard...');
                    window.location.href = 'index.html';
                }
            }).catch(err => {
                console.error('Erro ao sincronizar usuário:', err);
                this.showError('Erro ao carregar dados do usuário.');
            });

        } else {
            console.log('⚪ Nenhum usuário logado');
            this.currentUser = null;
            this.clearSession();

            // Se NÃO estiver na tela de login, redirecionar para login
            if (!window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
                window.location.href = 'login.html';
            }
        }
    }

    async syncUserWithDatabase(firebaseUser) {
        // Tenta encontrar usuário local ou no Firestore pelo email (Case Insensitive)
        const email = firebaseUser.email.toLowerCase();
        let users = db.getUsers();
        let user = users.find(u => u.email.toLowerCase() === email);

        if (user) {
            // USUÁRIO JÁ EXISTE (Pre-registro ou Login anterior)
            console.log(`👤 Usuário existente detectado: ${user.email} (${user.tipo})`);

            // Atualizar UID e Foto
            let changed = false;

            // Se o usuário existente não tiver ID do Firebase, atualizamos.
            // Isso permite que o 'restoreLegacyUsers' funcione com logins reais.
            if (user.id.startsWith('legacy_') || user.id.startsWith('pre_')) {
                // user.id = firebaseUser.uid; // Manter ID interno por enquanto para evitar quebra de relacionamentos antigos
                if (!user.authProvider) {
                    user.authProvider = 'firebase';
                    changed = true;
                }
            }

            // Atualizar foto se o Firebase tiver e for diferente
            if (firebaseUser.photoURL && user.photoURL !== firebaseUser.photoURL) {
                user.photoURL = firebaseUser.photoURL;
                changed = true;
            }

            // Fallback de foto
            if (!user.photoURL) {
                user.photoURL = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.nome || 'User') + '&background=random';
                changed = true;
            }

            // Garantir que Admin sempre tenha permissão total (Self-healing)
            if (user.tipo === 'admin' && (!user.permissoes || !user.permissoes.includes('*'))) {
                user.permissoes = ['*'];
                changed = true;
            }

            if (changed && db && db.updateUser) {
                db.updateUser(user.id, user);
            }
        } else {
            // NOVO USUÁRIO (Primeiro acesso absoluto e email não cadastrado previamente)
            console.log('🆕 Novo usuário detectado. Criando registro padrão...');
            const displayName = firebaseUser.displayName || email.split('@')[0];
            const displayPhoto = firebaseUser.photoURL || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=random');

            user = {
                id: firebaseUser.uid,
                username: email.split('@')[0],
                nome: displayName,
                email: email, // manter casing original ou lowercase? Preferir original para display.
                tipo: 'aluno', // Default type
                cargos: [],
                permissoes: ['aluno.own.view'],
                ativo: true,
                photoURL: displayPhoto,
                authProvider: 'firebase',
                dataCriacao: new Date().toISOString()
            };

            // Salvar no banco
            if (db && db.createUser) {
                db.createUser(user);
            }
        }

        return user;
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailLogin();
            });

            // Google Login
            const googleBtn = document.getElementById('googleLoginBtn');
            if (googleBtn) {
                googleBtn.addEventListener('click', () => this.handleGoogleLogin());
            }

            // Password strength (apenas visual, já que o Firebase gerencia policies, mas útil manter)
            const passwordInput = document.getElementById('password');
            if (passwordInput) {
                passwordInput.addEventListener('input', (e) => {
                    this.updatePasswordStrength(e.target.value);
                });
            }

            // Carregar config de suporte - mantendo funcionalidade original
            this.loadSupportConfig();
        }
    }

    handleEmailLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        this.setLoadingState(true, 'Entrando...');

        // Persistência
        const persistence = rememberMe ?
            firebase.auth.Auth.Persistence.LOCAL :
            firebase.auth.Auth.Persistence.SESSION;

        this.auth.setPersistence(persistence)
            .then(() => {
                return this.auth.signInWithEmailAndPassword(email, password);
            })
            .catch((error) => {
                console.error('Erro no login:', error);
                this.handleLoginError(error);
                this.setLoadingState(false);
            });
    }

    handleGoogleLogin() {
        if (window.location.protocol === 'file:') {
            alert('O login com Google não funciona diretamente pelo arquivo (file://). Por favor, use um servidor local (localhost).');
            return;
        }

        const provider = new firebase.auth.GoogleAuthProvider();

        this.setLoadingState(true, 'Conectando ao Google...');

        this.auth.signInWithPopup(provider)
            .catch((error) => {
                console.error('Erro no login Google:', error);
                this.handleLoginError(error);
                this.setLoadingState(false);
            });
    }

    logout() {
        this.auth.signOut().then(() => {
            console.log('👋 Logout realizado com sucesso');
            window.location.href = 'login.html';
        });
    }

    // --- Helpers ---

    saveSession(user) {
        // Mantemos localStorage para compatibilidade com o resto do app que lê 'saa_session'
        const sessionData = {
            user: user,
            timestamp: new Date().getTime(),
            firebase: true
        };
        localStorage.setItem('saa_session', JSON.stringify(sessionData));
        sessionStorage.setItem('saa_session', JSON.stringify(sessionData));
    }

    clearSession() {
        localStorage.removeItem('saa_session');
        sessionStorage.removeItem('saa_session');
    }

    handleLoginError(error) {
        let msg = 'Erro ao realizar login.';
        switch (error.code) {
            case 'auth/invalid-email': msg = 'Email inválido.'; break;
            case 'auth/user-disabled': msg = 'Usuário desativado.'; break;
            case 'auth/user-not-found': msg = 'Usuário não encontrado.'; break;
            case 'auth/wrong-password': msg = 'Senha incorreta.'; break;
            case 'auth/popup-closed-by-user': msg = 'Login cancelado pelo usuário.'; break;
            default: msg = error.message;
        }
        this.showError(msg);
    }

    setLoadingState(isLoading, text = 'Entrando...') {
        const loginBtn = document.querySelector('.login-btn');
        const googleBtn = document.getElementById('googleLoginBtn');

        if (loginBtn) {
            if (isLoading) {
                loginBtn.dataset.originalText = loginBtn.innerHTML;
                loginBtn.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i>${text}`;
                loginBtn.disabled = true;
                if (googleBtn) googleBtn.disabled = true;
            } else {
                loginBtn.innerHTML = loginBtn.dataset.originalText || 'Entrar';
                loginBtn.disabled = false;
                if (googleBtn) googleBtn.disabled = false;
            }
        }
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

    loadSupportConfig() {
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
            .catch(() => { });
    }

    // Funcionalidades mantidas (strength, permission)

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

    // Legacy support for app.js permissions check
    hasPermission(permission) {
        if (!this.currentUser) return false;

        // FAILSAFE: Admin supremo
        if (this.currentUser.tipo === 'admin' || this.currentUser.email === 'admin@escola.com') {
            return true;
        }

        if (this.currentUser.permissoes && this.currentUser.permissoes.includes('*')) return true;
        if (this.currentUser.permissoes && this.currentUser.permissoes.includes(permission)) return true;
        // Check wildcard
        if (this.currentUser.permissoes) {
            const parts = permission.split('.');
            if (parts.length === 2) {
                const wildcard = `${parts[0]}.*`;
                if (this.currentUser.permissoes.includes(wildcard)) return true;
            }
        }
        return false;
    }

    getUserInfo() { return this.currentUser; }

    // UI Modal handlers
    showChangePasswordModal() { console.log('Change password managed by Firebase'); return false; }
    handleChangePasswordFromModal() { /* Not used in Firebase auth flow directly */ }
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
