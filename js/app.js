/**
 * SAA - Sistema de Gestão Discente
 * Arquivo Principal da Aplicação
 * Versão: 1.0.0
 */

class SaaApp {
    constructor() {
        // Verificar se usuário está autenticado
        if (!auth.getUserInfo()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        console.log('🚀 Inicializando Sistema SAA...');

        // Inicializar componentes principais
        this.carregarNavegacao();
        this.carregarDashboard();
        this.carregarAlunos();
        this.carregarOcorrencias();
        this.carregarSelectAlunos();
        this.carregarProcessos();
        this.configurarFiltrosProcessos();

        // Inicializar sistemas
        this.inicializarChartJS();
        this.inicializarBackup();
        this.inicializarNotificacoes();

        // Aplicar permissões do usuário
        this.aplicarPermissoes();

        // Configurar verificações periódicas
        this.iniciarVerificacoesPeriodicas();

        console.log('✅ Sistema SAA inicializado com sucesso!');
    }

    // ==================== NAVEGAÇÃO ====================
    carregarNavegacao() {
        // Navegação sidebar
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('href').substring(1);
                this.mostrarSecao(target);

                // Atualizar active state
                document.querySelectorAll('.list-group-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Navegação navbar
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.mostrarSecao(target);
            });
        });
    }

    mostrarSecao(secao) {
        // Esconder todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Mostrar seção atual
        const secaoAtual = document.getElementById(secao);
        if (secaoAtual) {
            secaoAtual.classList.remove('d-none');
            secaoAtual.classList.add('fade-in');
            this.currentSection = secao;

            // Atualizar dados específicos da seção
            this.atualizarSecaoAtual(secao);
        }
    }

    atualizarSecaoAtual(secao) {
        switch (secao) {
            case 'dashboard':
                this.carregarDashboard();
                break;
            case 'alunos':
                this.carregarAlunos();
                break;
            case 'ocorrencias':
                this.carregarOcorrencias();
                break;
            case 'processos':
                this.carregarProcessos();
                break;
            case 'relatorios':
                if (typeof reportsManager !== 'undefined') {
                    reportsManager.init();
                }
                break;
            case 'backup':
                if (typeof backupSystem !== 'undefined') {
                    backupSystem.atualizarInterface();
                }
                break;
            case 'notificacoes':
                if (typeof notificationSystem !== 'undefined') {
                    notificationSystem.atualizarInterface();
                }
                break;
        }
    }

    // ==================== DASHBOARD ====================
    carregarDashboard() {
        const alunos = db.getAlunos();
        const ocorrencias = db.getOcorrencias();
        const processos = db.getProcessos();

        document.getElementById('totalAlunos').textContent = alunos.length;
        document.getElementById('totalOcorrencias').textContent = ocorrencias.length;
        document.getElementById('totalProcessos').textContent = processos.length;

        const suspensoes = ocorrencias.filter(o => o.tipo === 'grave' || o.tipo === 'gravissima').length;
        document.getElementById('totalSuspensoes').textContent = suspensoes;
    }

    // ==================== ALUNOS ====================
    carregarAlunos() {
        const alunos = db.getAlunos();
        const corpoTabela = document.getElementById('corpoTabelaAlunos');

        corpoTabela.innerHTML = alunos.map(aluno => `
            <tr>
                <td>${aluno.matricula}</td>
                <td>${aluno.nome}</td>
                <td>${aluno.curso}</td>
                <td>
                    <span class="badge bg-success">${aluno.status}</span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editarAluno('${aluno.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="excluirAluno('${aluno.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    carregarSelectAlunos() {
        const alunos = db.getAlunos();
        const select = document.getElementById('alunoOcorrencia');
        const selectProcesso = document.getElementById('alunoProcesso');

        if (select) {
            select.innerHTML = '<option value="">Selecione o aluno</option>' +
                alunos.map(aluno => `
                    <option value="${aluno.id}">${aluno.nome} - ${aluno.matricula}</option>
                `).join('');
        }

        if (selectProcesso) {
            selectProcesso.innerHTML = '<option value="">Selecione o aluno</option>' +
                alunos.map(aluno => `
                    <option value="${aluno.id}">${aluno.nome} - ${aluno.matricula}</option>
                `).join('');
        }
    }

    // ==================== OCORRÊNCIAS ====================
    carregarOcorrencias() {
        const ocorrencias = db.getOcorrencias();
        const alunos = db.getAlunos();
        const corpoTabela = document.getElementById('corpoTabelaOcorrencias');

        corpoTabela.innerHTML = ocorrencias.map(ocorrencia => {
            const aluno = alunos.find(a => a.id === ocorrencia.alunoId);
            const alunoNome = aluno ? aluno.nome : 'Aluno não encontrado';
            const gravidadeClass = {
                'leve': 'warning',
                'grave': 'danger',
                'gravissima': 'gravissima'
            }[ocorrencia.tipo];

            return `
                <tr>
                    <td>${new Date(ocorrencia.dataRegistro).toLocaleDateString()}</td>
                    <td>${alunoNome}</td>
                    <td>${ocorrencia.tipo}</td>
                    <td><span class="badge bg-${gravidadeClass}">${ocorrencia.tipo}</span></td>
                    <td>Sistema</td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="verOcorrencia('${ocorrencia.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ==================== PROCESSOS DISCIPLINARES ====================
    carregarProcessos(filtros = {}) {
        let processos = db.getProcessos();
        const alunos = db.getAlunos();

        // Aplicar filtros
        if (filtros.status) {
            processos = processos.filter(p => p.status === filtros.status);
        }
        if (filtros.gravidade) {
            processos = processos.filter(p => p.tipoInfracao === filtros.gravidade);
        }
        if (filtros.dataInicio) {
            processos = processos.filter(p => p.dataAbertura >= filtros.dataInicio);
        }
        if (filtros.dataFim) {
            processos = processos.filter(p => p.dataAbertura <= filtros.dataFim);
        }

        const corpoTabela = document.getElementById('corpoTabelaProcessos');

        corpoTabela.innerHTML = processos.map(processo => {
            const aluno = alunos.find(a => a.id === processo.alunoId);
            const alunoNome = aluno ? aluno.nome : 'Aluno não encontrado';
            const prazo = new Date(processo.prazo);
            const hoje = new Date();
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));

            const statusClass = {
                'aberto': 'success',
                'em_andamento': 'warning',
                'concluido': 'primary',
                'arquivado': 'secondary'
            }[processo.status];

            const gravidadeClass = {
                'leve': 'warning',
                'grave': 'danger',
                'gravissima': 'gravissima'
            }[processo.tipoInfracao];

            const prazoClass = diasRestantes < 3 ? 'danger' : diasRestantes < 7 ? 'warning' : 'success';

            return `
                <tr>
                    <td>${processo.numero}</td>
                    <td>${alunoNome}</td>
                    <td>${new Date(processo.dataAbertura).toLocaleDateString()}</td>
                    <td>${processo.artigo}</td>
                    <td><span class="badge bg-${gravidadeClass}">${processo.tipoInfracao}</span></td>
                    <td><span class="badge bg-${statusClass}">${processo.status}</span></td>
                    <td><span class="badge bg-${prazoClass}">${diasRestantes}d</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="verProcesso('${processo.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="editarProcesso('${processo.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${processo.status === 'aberto' ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="iniciarProcesso('${processo.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    configurarFiltrosProcessos() {
        document.getElementById('filtroStatus').addEventListener('change', () => this.aplicarFiltrosProcessos());
        document.getElementById('filtroGravidade').addEventListener('change', () => this.aplicarFiltrosProcessos());
        document.getElementById('filtroDataInicio').addEventListener('change', () => this.aplicarFiltrosProcessos());
        document.getElementById('filtroDataFim').addEventListener('change', () => this.aplicarFiltrosProcessos());
    }

    aplicarFiltrosProcessos() {
        const filtros = {
            status: document.getElementById('filtroStatus').value,
            gravidade: document.getElementById('filtroGravidade').value,
            dataInicio: document.getElementById('filtroDataInicio').value,
            dataFim: document.getElementById('filtroDataFim').value
        };

        this.carregarProcessos(filtros);
    }

    // ==================== RELATÓRIOS E GRÁFICOS ====================
    inicializarChartJS() {
        // Carregar Chart.js dinamicamente se não estiver carregado
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                this.inicializarRelatorios();
            };
            document.head.appendChild(script);
        } else {
            this.inicializarRelatorios();
        }
    }

    inicializarRelatorios() {
        // Inicializar relatórios quando a seção for carregada
        const relatoriosSection = document.getElementById('relatorios');
        if (relatoriosSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!relatoriosSection.classList.contains('d-none')) {
                            if (typeof reportsManager !== 'undefined') {
                                reportsManager.init();
                            }
                        }
                    }
                });
            });

            observer.observe(relatoriosSection, { attributes: true });
        }
    }

    // ==================== BACKUP ====================
    inicializarBackup() {
        // Inicializar backup quando a seção for carregada
        const backupSection = document.getElementById('backup');
        if (backupSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!backupSection.classList.contains('d-none')) {
                            if (typeof backupSystem !== 'undefined') {
                                backupSystem.atualizarInterface();
                            }
                        }
                    }
                });
            });

            observer.observe(backupSection, { attributes: true });
        }
    }

    // ==================== NOTIFICAÇÕES ====================
    inicializarNotificacoes() {
        // Inicializar notificações quando a seção for carregada
        const notificacoesSection = document.getElementById('notificacoes');
        if (notificacoesSection) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        if (!notificacoesSection.classList.contains('d-none')) {
                            if (typeof notificationSystem !== 'undefined') {
                                notificationSystem.atualizarInterface();
                            }
                        }
                    }
                });
            });

            observer.observe(notificacoesSection, { attributes: true });
        }

        // Atualizar badge da navbar periodicamente
        setInterval(() => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.atualizarBadgeNavbar();
            }
        }, 60000); // A cada minuto
    }

    // ==================== PERMISSÕES ====================
    aplicarPermissoes() {
        const user = auth.getUserInfo();
        if (!user) return;

        console.log(`👤 Usuário logado: ${user.nome} (${user.tipo})`);

        // Esconder/mostrar elementos baseado nas permissões
        this.toggleElementByPermission('[data-permission="alunos.criar"]', 'alunos.criar');
        this.toggleElementByPermission('[data-permission="processos.criar"]', 'processos.criar');
        this.toggleElementByPermission('[data-permission="backup.gerenciar"]', 'backup.gerenciar');
        this.toggleElementByPermission('[data-permission="configuracoes.gerenciar"]', 'configuracoes.gerenciar');

        // Esconder seções baseadas no tipo de usuário
        // Esconder seções baseadas no tipo de usuário/cargo
        const secoesPermitidas = {
            'admin': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'relatorios', 'backup', 'notificacoes', 'usuarios'],
            'gestor': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'relatorios', 'backup', 'notificacoes'], // "Acesso Total" solicitado
            'coordenador': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'relatorios', 'notificacoes'], // "Acesso Total" solicitado
            'professor': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'notificacoes'],
            'secretaria': ['dashboard', 'alunos', 'ocorrencias', 'processos'],
            'servidor': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'notificacoes'],
            'aluno': ['dashboard', 'ocorrencias', 'notificacoes'] // Apenas Ocorrências (e dashboard básico)
        };

        // Atualizar Nome/Role na UI
        this.atualizarInterfaceUsuario(user);

        const secoes = document.querySelectorAll('.content-section');
        secoes.forEach(secao => {
            const idSecao = secao.id;
            if (secoesPermitidas[user.tipo]?.includes(idSecao)) {
                // Permitido: Garantir visibilidade se for a seção ativa (controlado pelo router/navegação)
                // Mas IMPORTANTE: remover d-none caso tenha sido aplicado manualmente no HTML (ex: usuarios)
                // O router normalmente troca display none/block.
                // Vamos apenas garantir que não haja 'd-none' IMPEDITIVO se for navegar.
                // A lógica de navegação (mostrarSecao) deve lidar com o display block.
            } else {
                // Proibido
                secao.classList.add('d-none'); // Força ocultação
            }
        });

        // Menu Sidebar Items
        const menuItems = document.querySelectorAll('.list-group-item');
        menuItems.forEach(item => {
            const href = item.getAttribute('href');
            if (!href) return;
            const idSecao = href.replace('#', '');

            if (secoesPermitidas[user.tipo]?.includes(idSecao)) {
                item.classList.remove('d-none');
                item.style.display = ''; // Reset inline style
            } else {
                item.classList.add('d-none');
            }
        });
    }

    toggleElementByPermission(selector, permission) {
        const element = document.querySelector(selector);
        if (element && !auth.hasPermission(permission)) {
            element.style.display = 'none';
        }
    }

    atualizarInterfaceUsuario(user) {
        if (!user) return;
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            // Exibir Nome (ou Email se vazio)
            userNameElement.textContent = user.nome || user.email;
        }

        // Opcional: Se tiver um lugar para exibir o cargo no menu
        // const userRoleElement = document.getElementById('userRole');
    }

    verificarTrocaSenhaObrigatoria() {
        const user = auth.getUserInfo();
        if (user && user.forcePasswordChange === true) {
            // Mostrar modal de troca de senha obrigatória
            setTimeout(() => {
                const modal = new bootstrap.Modal(document.getElementById('modalTrocaSenha'));
                modal.show();
            }, 1000); // Delay para garantir que a página carregou
        }
    }

    // ==================== VERIFICAÇÕES PERIÓDICAS ====================
    iniciarVerificacoesPeriodicas() {
        // Verificar alertas a cada 5 minutos
        setInterval(() => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.verificarAlertasSistema();
            }
        }, 300000);

        // Verificação inicial após 5 segundos
        setTimeout(() => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.verificarAlertasSistema();
            }
        }, 5000);
    }

    // ==================== UTILITÁRIOS ====================
    getStatusClass(status) {
        const classes = {
            'aberto': 'success',
            'em_andamento': 'warning',
            'concluido': 'primary',
            'arquivado': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    getGravidadeClass(gravidade) {
        const classes = {
            'leve': 'warning',
            'grave': 'danger',
            'gravissima': 'gravissima'
        };
        return classes[gravidade] || 'secondary';
    }

    // Método para disparar notificações de outros módulos
    dispararNotificacao(dados) {
        if (typeof notificationSystem !== 'undefined') {
            return notificationSystem.criarNotificacao(dados);
        }
        return null;
    }
    // ==================== GESTÃO DE USUÁRIOS ====================
    carregarUsuarios() {
        if (!auth.hasPermission('admin.users')) {
            // Somente admin vê, mas por segurança checamos
            if (auth.currentUser && auth.currentUser.tipo !== 'admin') return;
        }

        const tbody = document.getElementById('corpoTabelaUsuarios');
        if (!tbody) return;

        tbody.innerHTML = '';
        const users = db.getUsers();

        users.forEach(user => {
            const cargos = user.cargos ? user.cargos.join(', ') : '-';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-${this.getBadgeColor(user.tipo)}">${user.tipo}</span></td>
                <td><small>${cargos}</small></td>
                <td>${user.ativo ? '<span class="text-success">Ativo</span>' : '<span class="text-danger">Inativo</span>'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="app.editarUsuario('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <!-- Delete reservado para futuro -->
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    getBadgeColor(tipo) {
        switch (tipo) {
            case 'admin': return 'dark';
            case 'gestor': return 'danger';
            case 'coordenador': return 'primary';
            case 'servidor': return 'info';
            default: return 'secondary';
        }
    }

    abrirModalUsuario() {
        // Limpar form
        document.getElementById('formUsuario').reset();
        document.getElementById('idUsuario').value = '';
        document.getElementById('tituloModalUsuario').innerText = 'Novo Usuário';

        // Mostrar campo de senha para novo usuário
        document.getElementById('divSenhaInicial').style.display = 'block';

        // Reset visibilidade
        this.atualizarOpcoesCargos();

        new bootstrap.Modal(document.getElementById('modalUsuario')).show();
    }

    atualizarOpcoesCargos() {
        const tipo = document.getElementById('tipoUsuario').value;
        const divCurso = document.getElementById('divCursoCoordenador');
        const divComissao = document.getElementById('divCargosComissao');

        // Reset displays
        divCurso.style.display = 'none';
        divComissao.style.display = 'none';

        if (tipo === 'coordenador') {
            divCurso.style.display = 'block';
        } else if (tipo === 'gestor' || tipo === 'servidor') {
            // Mostrar opções de comissão para Gestor ou Servidor (que pode ser membro)
            divComissao.style.display = 'block';
        }
    }

    async salvarUsuario() {
        const id = document.getElementById('idUsuario').value;
        const nome = document.getElementById('nomeUsuario').value;
        const email = document.getElementById('emailUsuario').value;
        const tipo = document.getElementById('tipoUsuario').value;
        const curso = document.getElementById('cursoCoordenador').value;
        const cargoComissao = document.getElementById('selectCargoComissao').value;
        const senhaInicial = document.getElementById('senhaInicial').value;

        // Coletar cargos baseados no dropdown
        const cargos = [];
        if (cargoComissao) {
            cargos.push(cargoComissao);
            // Se for presidente, adiciona tag 'cgen' implicita também
            if (cargoComissao === 'presidente_cdp') cargos.push('cgen');
        }
        // Se for coordenador, o cargo é implicito
        if (tipo === 'coordenador') cargos.push('coordenador');
        if (tipo === 'admin') cargos.push('admin');

        if (!email || !nome) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        const userData = {
            nome,
            email,
            tipo,
            cargos,
            curso: (tipo === 'coordenador') ? curso : null
        };

        if (id) {
            // Atualizar usuário existente
            db.updateUser(id, userData);
            alert('Usuário atualizado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            this.carregarUsuarios();
        } else {
            // Criar novo usuário
            if (!senhaInicial || senhaInicial.length < 6) {
                alert('Por favor, defina uma senha inicial com no mínimo 6 caracteres.');
                return;
            }

            // Criar usuário no Firebase Authentication
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, senhaInicial);
                const firebaseUser = userCredential.user;

                // Criar registro no banco local
                const newUser = {
                    ...userData,
                    id: firebaseUser.uid,
                    permissoes: this.gerarPermissoesPadrao(tipo, cargos),
                    ativo: true,
                    authProvider: 'firebase',
                    forcePasswordChange: true, // Flag para forçar troca de senha
                    dataCriacao: new Date().toISOString()
                };

                db.createUser(newUser);

                alert(`Usuário ${nome} criado com sucesso!\nSenha inicial: ${senhaInicial} \n\nO usuário será obrigado a trocar a senha no primeiro acesso.`);

                bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
                this.carregarUsuarios();
            } catch (error) {
                console.error('Erro ao criar usuário:', error);
                let msg = 'Erro ao criar usuário no Firebase.';
                if (error.code === 'auth/email-already-in-use') {
                    msg = 'Este email já está em uso.';
                } else if (error.code === 'auth/weak-password') {
                    msg = 'Senha muito fraca. Use no mínimo 6 caracteres.';
                }
                alert(msg);
            }
        }
    }

    togglePasswordVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    async trocarSenhaObrigatoria() {
        const senhaAtual = document.getElementById('senhaAtual').value;
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        // Validações
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        if (novaSenha.length < 6) {
            alert('A nova senha deve ter no mínimo 6 caracteres.');
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        if (senhaAtual === novaSenha) {
            alert('A nova senha deve ser diferente da senha atual.');
            return;
        }

        try {
            const user = firebase.auth().currentUser;

            // Reautenticar com senha atual
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                senhaAtual
            );

            await user.reauthenticateWithCredential(credential);

            // Atualizar senha
            await user.updatePassword(novaSenha);

            // Remover flag de troca obrigatória
            const currentUser = auth.getUserInfo();
            if (currentUser) {
                currentUser.forcePasswordChange = false;
                db.updateUser(currentUser.id, { forcePasswordChange: false });
            }

            // Fechar modal
            bootstrap.Modal.getInstance(document.getElementById('modalTrocaSenha')).hide();

            alert('Senha alterada com sucesso!');

            // Limpar form
            document.getElementById('formTrocaSenha').reset();

        } catch (error) {
            console.error('Erro ao trocar senha:', error);
            let msg = 'Erro ao alterar senha.';
            if (error.code === 'auth/wrong-password') {
                msg = 'Senha atual incorreta.';
            } else if (error.code === 'auth/weak-password') {
                msg = 'Senha muito fraca.';
            }
            alert(msg);
        }
    }

    editarUsuario(id) {
        const users = db.getUsers();
        const user = users.find(u => u.id === id);
        if (!user) return;

        document.getElementById('idUsuario').value = user.id;
        document.getElementById('nomeUsuario').value = user.nome;
        document.getElementById('emailUsuario').value = user.email;
        document.getElementById('tipoUsuario').value = user.tipo;
        if (user.curso) document.getElementById('cursoCoordenador').value = user.curso;

        // Esconder campo de senha ao editar
        document.getElementById('divSenhaInicial').style.display = 'none';

        // Atualizar visibilidade
        this.atualizarOpcoesCargos();

        // Setar cargo de comissão se existir
        const selectCargo = document.getElementById('selectCargoComissao');
        selectCargo.value = "";
        if (user.cargos) {
            // Tenta encontrar um dos cargos conhecidos no select
            Array.from(selectCargo.options).forEach(opt => {
                if (user.cargos.includes(opt.value)) {
                    selectCargo.value = opt.value;
                }
            });
        }

        document.getElementById('tituloModalUsuario').innerText = 'Editar Usuário';
        new bootstrap.Modal(document.getElementById('modalUsuario')).show();
    }

    gerarPermissoesPadrao(tipo, cargos) {
        let perms = [];
        if (tipo === 'admin') return ['*'];
        if (tipo === 'aluno') perms.push('aluno.own.view');

        if (tipo === 'gestor' || cargos.includes('cgen') || cargos.includes('dren')) {
            perms.push('processos.view', 'processos.create', 'processos.update', 'ocorrencias.view', 'relatorios.view');
        }

        if (tipo === 'coordenador') {
            perms.push('alunos.view', 'ocorrencias.create', 'ocorrencias.view', 'processos.view');
        }

        if (cargos.includes('membro_cdp')) {
            perms.push('processos.view');
        }

        return perms;
    }
}

// ==================== FUNÇÕES GLOBAIS ====================

// Alunos
function salvarAluno() {
    const nome = document.getElementById('nomeAluno').value;
    const matricula = document.getElementById('matriculaAluno').value;
    const curso = document.getElementById('cursoAluno').value;
    const nascimento = document.getElementById('nascimentoAluno').value;

    const aluno = {
        nome,
        matricula,
        curso,
        nascimento
    };

    db.salvarAluno(aluno);

    // Fechar modal e atualizar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAluno'));
    modal.hide();

    document.getElementById('formAluno').reset();
    app.carregarAlunos();
    app.carregarSelectAlunos();
    app.carregarDashboard();

    // Notificação
    app.dispararNotificacao({
        titulo: 'Aluno cadastrado',
        mensagem: `Aluno ${nome} cadastrado com sucesso.`,
        tipo: 'aluno',
        prioridade: 'normal'
    });
}

function editarAluno(id) {
    // Implementar edição de aluno
    console.log('Editar aluno:', id);
    alert('Funcionalidade de edição em desenvolvimento');
}

function excluirAluno(id) {
    if (confirm('Tem certeza que deseja excluir este aluno?')) {
        // Implementar exclusão de aluno
        console.log('Excluir aluno:', id);
        alert('Funcionalidade de exclusão em desenvolvimento');
    }
}

// Ocorrências
function salvarOcorrencia() {
    const alunoId = document.getElementById('alunoOcorrencia').value;
    const tipo = document.getElementById('tipoOcorrencia').value;
    const descricao = document.getElementById('descricaoOcorrencia').value;
    const artigo = document.getElementById('artigoOcorrencia').value;

    const ocorrencia = {
        alunoId,
        tipo,
        descricao,
        artigo
    };

    const novaOcorrencia = db.salvarOcorrencia(ocorrencia);

    // Fechar modal e atualizar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalOcorrencia'));
    modal.hide();

    document.getElementById('formOcorrencia').reset();
    app.carregarOcorrencias();
    app.carregarDashboard();

    // Notificação padrão
    app.dispararNotificacao({
        titulo: 'Ocorrência registrada',
        mensagem: `Ocorrência do tipo ${tipo} registrada com sucesso.`,
        tipo: 'aluno',
        prioridade: tipo === 'gravissima' ? 'alta' : 'normal'
    });

    // Automação: Criar processo disciplinar para infrações graves/gravíssimas
    if (tipo === 'grave' || tipo === 'gravissima') {
        const processo = {
            alunoId,
            tipoInfracao: tipo,
            artigo: artigo || 'Regimento Escolar',
            descricao: `Processo automático gerado a partir da ocorrência de ${tipo}. Descrição original: ${descricao} `,
            dataOcorrencia: new Date().toISOString().split('T')[0],
            localOcorrencia: 'Instituição (Registro Automático)',
            testemunhas: [],
            providenciasImediatas: 'Abertura automática de processo disciplinar conforme regulamento.'
        };

        const novoProcesso = db.salvarProcesso(processo);
        console.log('⚙️ Processo disciplinar criado automaticamente:', novoProcesso.numero);

        // Notificação específica para o Admin
        app.dispararNotificacao({
            titulo: '⚠️ Processo Disciplinar Automático',
            mensagem: `Processo ${novoProcesso.numero} aberto para ocorrência ${tipo}. Prazo de 20 dias iniciado.Verifique para dar prosseguimento.`,
            tipo: 'processo',
            prioridade: 'alta',
            categoria: 'sistema',
            acao: 'ver_processo',
            dados: { processoId: novoProcesso.id }
        });

        // Atualizar lista de processos também
        app.carregarProcessos();

        // Feedback visual extra
        setTimeout(() => {
            alert(`ATENÇÃO: Um Processo Disciplinar(${novoProcesso.numero}) foi aberto automaticamente devido à gravidade da ocorrência.`);
        }, 1000);
    }
}

function verOcorrencia(id) {
    // Implementar visualização de ocorrência
    console.log('Ver ocorrência:', id);
    alert('Funcionalidade de visualização em desenvolvimento');
}



// Processos Disciplinares
function salvarProcesso() {
    const alunoId = document.getElementById('alunoProcesso').value;
    const tipoInfracao = document.getElementById('tipoInfracao').value;
    const artigo = document.getElementById('artigoProcesso').value;
    const descricao = document.getElementById('descricaoProcesso').value;
    const dataOcorrencia = document.getElementById('dataOcorrencia').value;
    const localOcorrencia = document.getElementById('localOcorrencia').value;
    const testemunhas = document.getElementById('testemunhasProcesso').value;
    const providencias = document.getElementById('providenciasImediatas').value;

    const processo = {
        alunoId,
        tipoInfracao,
        artigo,
        descricao,
        dataOcorrencia,
        localOcorrencia,
        testemunhas: testemunhas ? testemunhas.split(',') : [],
        providenciasImediatas: providencias
    };

    db.salvarProcesso(processo);

    // Fechar modal e atualizar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalProcesso'));
    modal.hide();

    document.getElementById('formProcesso').reset();
    app.carregarProcessos();
    app.carregarDashboard();

    // Notificação
    app.dispararNotificacao({
        titulo: 'Processo disciplinar aberto',
        mensagem: `Processo do tipo ${tipoInfracao} aberto com sucesso.`,
        tipo: 'processo',
        prioridade: 'normal'
    });

    alert('Processo disciplinar aberto com sucesso!');
}

function verProcesso(id) {
    const processo = db.getProcessos().find(p => p.id === id);
    const aluno = db.getAlunos().find(a => a.id === processo.alunoId);

    if (processo && aluno) {
        // Preencher dados no modal
        document.getElementById('numeroProcessoDetalhes').textContent = processo.numero;
        document.getElementById('detalheAluno').textContent = aluno.nome;
        document.getElementById('detalheMatricula').textContent = aluno.matricula;
        document.getElementById('detalheDataAbertura').textContent = new Date(processo.dataAbertura).toLocaleDateString();
        document.getElementById('detalheStatus').innerHTML = `< span class="badge bg-${app.getStatusClass(processo.status)}" > ${processo.status}</span > `;
        document.getElementById('detalheGravidade').innerHTML = `< span class="badge bg-${app.getGravidadeClass(processo.tipoInfracao)}" > ${processo.tipoInfracao}</span > `;

        // Preencher timeline
        const timeline = document.getElementById('timelineProcesso');
        timeline.innerHTML = processo.timeline.map(item => `
                    < div class="timeline-item mb-3" >
                <small class="text-muted">${new Date(item.data).toLocaleDateString()} - ${item.acao}</small>
                <div>${item.descricao}</div>
            </div >
                    `).join('');

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesProcesso'));
        modal.show();
    }
}

function editarProcesso(id) {
    // Implementar edição de processo
    console.log('Editar processo:', id);
    alert('Funcionalidade de edição em desenvolvimento');
}

function iniciarProcesso(id) {
    if (confirm('Deseja iniciar a tramitação deste processo?')) {
        const processo = db.getProcessos().find(p => p.id === id);
        if (processo) {
            processo.status = 'em_andamento';
            db.atualizarProcesso(processo);

            db.adicionarAndamento(id, {
                tipo: 'Início de Tramitação',
                descricao: 'Processo em andamento - Comissão Disciplinar notificada'
            });

            app.carregarProcessos();

            // Notificação
            app.dispararNotificacao({
                titulo: 'Processo em andamento',
                mensagem: `Processo ${processo.numero} iniciou tramitação.`,
                tipo: 'processo',
                prioridade: 'normal'
            });

            alert('Processo iniciado com sucesso!');
        }
    }
}

// ==================== INICIALIZAÇÃO DA APLICAÇÃO ====================

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    // Check and restore legacy users if needed
    if (window.db && window.restoreLegacyUsers) {
        const users = window.db.getUsers();
        const hasAdmin = users.some(u => u.tipo === 'admin');
        if (users.length === 0 || !hasAdmin) {
            console.log('⚠️ Base de usuários vazia ou sem admin. Executando restauração automática...');
            window.restoreLegacyUsers();
        }
    }

    // Atualizar informações do usuário logado
    const user = auth.getUserInfo();
    if (user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.nome;
        }
    }

    // Inicializar aplicação principal
    window.app = new SaaApp();
});

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaaApp };
}