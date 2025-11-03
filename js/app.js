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
        switch(secao) {
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
        const secoesPermitidas = {
            'admin': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'relatorios', 'backup', 'notificacoes'],
            'coordenador': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'relatorios', 'notificacoes'],
            'professor': ['dashboard', 'alunos', 'ocorrencias', 'processos', 'notificacoes'],
            'secretaria': ['dashboard', 'alunos', 'ocorrencias', 'processos']
        };

        const secoes = document.querySelectorAll('.content-section');
        secoes.forEach(secao => {
            const idSecao = secao.id;
            if (!secoesPermitidas[user.tipo]?.includes(idSecao)) {
                secao.style.display = 'none';
            }
        });
    }

    toggleElementByPermission(selector, permission) {
        const element = document.querySelector(selector);
        if (element && !auth.hasPermission(permission)) {
            element.style.display = 'none';
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

    db.salvarOcorrencia(ocorrencia);
    
    // Fechar modal e atualizar
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalOcorrencia'));
    modal.hide();
    
    document.getElementById('formOcorrencia').reset();
    app.carregarOcorrencias();
    app.carregarDashboard();
    
    // Notificação
    app.dispararNotificacao({
        titulo: 'Ocorrência registrada',
        mensagem: `Ocorrência do tipo ${tipo} registrada com sucesso.`,
        tipo: 'aluno',
        prioridade: tipo === 'gravissima' ? 'alta' : 'normal'
    });
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
        document.getElementById('detalheStatus').innerHTML = `<span class="badge bg-${app.getStatusClass(processo.status)}">${processo.status}</span>`;
        document.getElementById('detalheGravidade').innerHTML = `<span class="badge bg-${app.getGravidadeClass(processo.tipoInfracao)}">${processo.tipoInfracao}</span>`;
        
        // Preencher timeline
        const timeline = document.getElementById('timelineProcesso');
        timeline.innerHTML = processo.timeline.map(item => `
            <div class="timeline-item mb-3">
                <small class="text-muted">${new Date(item.data).toLocaleDateString()} - ${item.acao}</small>
                <div>${item.descricao}</div>
            </div>
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
document.addEventListener('DOMContentLoaded', function() {
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