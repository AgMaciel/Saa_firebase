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

    createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                nome: 'Administrador Sistema',
                email: 'admin@saa.edu.br',
                tipo: 'admin',
                permissoes: ['*'],
                ativo: true,
                dataCriacao: new Date().toISOString()
            },
            {
                id: 2,
                username: 'coordenador',
                password: 'coord123',
                nome: 'Coordenador Pedagógico',
                email: 'coordenador@saa.edu.br',
                tipo: 'coordenador',
                permissoes: [
                    'alunos.ver', 'alunos.editar', 
                    'ocorrencias.*', 
                    'processos.*', 
                    'relatorios.ver',
                    'notificacoes.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString()
            },
            {
                id: 3,
                username: 'professor',
                password: 'prof123',
                nome: 'Professor Exemplo',
                email: 'professor@saa.edu.br',
                tipo: 'professor',
                permissoes: [
                    'alunos.ver', 
                    'ocorrencias.criar', 'ocorrencias.ver', 
                    'processos.ver',
                    'notificacoes.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString()
            },
            {
                id: 4,
                username: 'secretaria',
                password: 'sec123',
                nome: 'Secretaria Acadêmica',
                email: 'secretaria@saa.edu.br',
                tipo: 'secretaria',
                permissoes: [
                    'alunos.*', 
                    'ocorrencias.ver', 
                    'processos.ver', 
                    'relatorios.ver'
                ],
                ativo: true,
                dataCriacao: new Date().toISOString()
            }
        ];

        localStorage.setItem('saa_users', JSON.stringify(defaultUsers));
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        const loginBtn = document.querySelector('.login-btn');
        const originalText = loginBtn.innerHTML;

        // Mostrar loading
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando...';
        loginBtn.disabled = true;

        // Simular delay de rede
        setTimeout(() => {
            const user = this.authenticate(username, password);

            if (user) {
                this.login(user, rememberMe);
                this.redirectToApp();
            } else {
                this.showError('Usuário ou senha inválidos');
                loginBtn.innerHTML = originalText;
                loginBtn.disabled = false;
            }
        }, 1500);
    }

    authenticate(username, password) {
        const users = JSON.parse(localStorage.getItem('saa_users')) || [];
        return users.find(user => 
            user.username === username && 
            user.password === password && 
            user.ativo === true
        );
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

        // Registrar log de acesso
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
            
            // Verificar se a sessão expirou (8 horas)
            const sessionAge = new Date().getTime() - sessionData.timestamp;
            const eightHours = 8 * 60 * 60 * 1000;
            
            if (sessionAge < eightHours) {
                this.currentUser = sessionData.user;
                
                // Se estiver na página de login, redirecionar para app
                if (window.location.pathname.includes('login.html') || window.location.pathname === '/') {
                    this.redirectToApp();
                }
            } else {
                this.logout();
            }
        } else if (!window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
            // Redirecionar para login se não estiver autenticado
            window.location.href = 'login.html';
        }
    }

    redirectToApp() {
        window.location.href = 'index.html';
    }

    showError(message) {
        // Remover alertas anteriores
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        // Inserir antes do formulário
        const loginCard = document.querySelector('.login-card');
        loginCard.insertBefore(alert, loginCard.firstChild);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        if (this.currentUser.permissoes.includes('*')) {
            return true;
        }
        
        // Verificar permissão específica
        if (this.currentUser.permissoes.includes(permission)) {
            return true;
        }
        
        // Verificar permissão por wildcard (ex: alunos.*)
        const permissionParts = permission.split('.');
        if (permissionParts.length === 2) {
            const wildcardPermission = `${permissionParts[0]}.*`;
            if (this.currentUser.permissoes.includes(wildcardPermission)) {
                return true;
            }
        }
        
        return false;
    }

    getUserInfo() {
        return this.currentUser;
    }

    registrarLogAcesso(user) {
        const logs = JSON.parse(localStorage.getItem('saa_access_logs')) || [];
        
        logs.push({
            userId: user.id,
            username: user.username,
            tipo: user.tipo,
            dataAcesso: new Date().toISOString(),
            ip: 'localhost'
        });

        localStorage.setItem('saa_access_logs', JSON.stringify(logs));
    }

    // Método para desenvolvimento - login rápido
    quickLogin(tipo) {
        const users = JSON.parse(localStorage.getItem('saa_users')) || [];
        const user = users.find(u => u.tipo === tipo);
        
        if (user) {
            document.getElementById('username').value = user.username;
            document.getElementById('password').value = user.password;
            document.getElementById('rememberMe').checked = true;
            
            // Disparar submit do formulário
            document.getElementById('loginForm').dispatchEvent(new Event('submit'));
        }
    }

    // Gerenciamento de usuários
    getUsers() {
        return JSON.parse(localStorage.getItem('saa_users')) || [];
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: Date.now(),
            ...userData,
            dataCriacao: new Date().toISOString(),
            ativo: true
        };
        users.push(newUser);
        localStorage.setItem('saa_users', JSON.stringify(users));
        return newUser;
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('saa_users', JSON.stringify(users));
            
            // Atualizar usuário atual se for o mesmo
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = users[index];
            }
            
            return users[index];
        }
        return null;
    }

    // Mudança de senha
    changePassword(userId, currentPassword, newPassword) {
        const users = this.getUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return { success: false, message: 'Usuário não encontrado' };
        }
        
        if (user.password !== currentPassword) {
            return { success: false, message: 'Senha atual incorreta' };
        }
        
        user.password = newPassword;
        localStorage.setItem('saa_users', JSON.stringify(users));
        
        return { success: true, message: 'Senha alterada com sucesso' };
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

function quickLogin(tipo) {
    auth.quickLogin(tipo);
}

// Inicializar sistema de auth
const auth = new AuthSystem();