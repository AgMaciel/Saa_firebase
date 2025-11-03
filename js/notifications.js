/**
 * SAA - Sistema de Gestão Discente
 * Sistema de Notificações e Alertas
 * Versão: 1.0.0
 */

class NotificationSystem {
    constructor() {
        this.notificationsKey = 'saa_notifications';
        this.configKey = 'saa_notifications_config';
        this.autoRefreshInterval = null;
        this.useFirestore = false; // habilitado se detectar Firebase
        this.db = null;
        this.unsubscribeNotifications = null;
        this.init();
    }

    init() {
        this.carregarConfiguracoes();
        this.inicializarNotificacoesPadrao();
        // Inicializa sincronização com Firebase/Firestore se disponível
        this.initFirebaseSync();
        this.iniciarAutoRefresh();
        this.configurarEventListeners();
        this.atualizarBadgeNavbar();
        console.log('🔔 Notification System inicializado');
    }

    // Inicializa a sincronização com Firebase/Firestore se a SDK estiver carregada
    initFirebaseSync() {
        try {
            // Suporta tanto a versão namespaced (firebase) quanto checagem simples
            if (window.firebase && (firebase.firestore || (firebase && firebase.apps && firebase.apps.length >= 0))) {
                // Se a app ainda não foi inicializada, assume que o dev colocou window.firebaseConfig e a SDK
                if (!firebase.apps || firebase.apps.length === 0) {
                    if (window.firebaseConfig) {
                        firebase.initializeApp(window.firebaseConfig);
                    }
                }

                if (firebase.firestore) {
                    this.db = firebase.firestore();
                    this.useFirestore = true;
                    // Escuta alterações na coleção e sincroniza para localStorage
                    this.unsubscribeNotifications = this.db.collection('notifications')
                        .orderBy('data', 'desc')
                        .onSnapshot(snapshot => {
                            const docs = snapshot.docs.map(d => {
                                const data = d.data();
                                // Garantir que exista id
                                data.id = d.id;
                                return data;
                            });

                            // Atualiza localStorage com dados do Firestore
                            localStorage.setItem(this.notificationsKey, JSON.stringify(docs));
                            // Atualiza UI
                            this.atualizarBadgeNavbar();
                            this.atualizarInterface();
                        }, err => {
                            console.warn('Firestore onSnapshot erro:', err);
                        });

                    // Sincroniza local->firestore inicialmente (merge simples)
                    this.syncLocalToFirestore();
                    console.log('🔔 Firebase/Firestore sincronização ativada');
                }
            }
        } catch (e) {
            console.warn('initFirebaseSync falhou:', e);
            this.useFirestore = false;
        }
    }

    // Envia notificações locais que não existam no Firestore
    async syncLocalToFirestore() {
        if (!this.useFirestore || !this.db) return;

        try {
            const local = JSON.parse(localStorage.getItem(this.notificationsKey)) || [];
            // Buscar ids existentes no firestore
            const snapshot = await this.db.collection('notifications').get();
            const existingIds = new Set(snapshot.docs.map(d => d.id));

            const batch = this.db.batch ? this.db.batch() : null;

            for (const n of local) {
                // Usar doc id igual ao campo id se for um string sem espaços
                const docRef = this.db.collection('notifications').doc(n.id);
                if (!existingIds.has(n.id)) {
                    if (batch) {
                        batch.set(docRef, n);
                    } else {
                        await docRef.set(n).catch(() => {});
                    }
                }
            }

            if (batch) {
                await batch.commit().catch(() => {});
            }
        } catch (e) {
            console.warn('syncLocalToFirestore erro:', e);
        }
    }

    carregarConfiguracoes() {
        const configSalva = localStorage.getItem(this.configKey);
        if (configSalva) {
            this.config = JSON.parse(configSalva);
        } else {
            this.config = {
                email: true,
                sistema: true,
                sonoros: false,
                autoRefresh: true,
                alertas: {
                    processosPrazos: true,
                    ocorrenciasGraves: true,
                    backupFalha: true,
                    sistema: true,
                    seguranca: true
                }
            };
            this.salvarConfiguracoes();
        }
    }

    salvarConfiguracoes() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
    }

    inicializarNotificacoesPadrao() {
        const notificacoes = this.getNotificacoes();
        if (notificacoes.length === 0) {
            // Notificação de boas-vindas
            this.criarNotificacao({
                titulo: 'Bem-vindo ao Sistema SAA',
                mensagem: 'O sistema de notificações está ativo. Você receberá alertas importantes aqui.',
                tipo: 'sistema',
                prioridade: 'normal',
                categoria: 'sistema'
            });
        }
    }

    // Criar notificações
    criarNotificacao(dados) {
        const notificacao = {
            id: this.gerarIdNotificacao(),
            titulo: dados.titulo,
            mensagem: dados.mensagem,
            tipo: dados.tipo || 'sistema',
            prioridade: dados.prioridade || 'normal',
            categoria: dados.categoria || 'geral',
            lida: false,
            data: new Date().toISOString(),
            acao: dados.acao || null,
            dados: dados.dados || null,
            expiracao: dados.expiracao || null
        };

        const notificacoes = this.getNotificacoes();
        notificacoes.unshift(notificacao); // Adicionar no início
        localStorage.setItem(this.notificationsKey, JSON.stringify(notificacoes));

        // Se Firestore estiver disponível, salvar também (best-effort)
        if (this.useFirestore && this.db) {
            try {
                this.db.collection('notifications').doc(notificacao.id).set(notificacao).catch(err => {
                    console.warn('Erro salvando notificação no Firestore:', err);
                });
            } catch (e) {
                console.warn('criarNotificacao firestore erro:', e);
            }
        }

        // Mostrar toast se configurado
        if (this.config.sistema) {
            this.mostrarToast(notificacao);
        }

        // Atualizar interface
        this.atualizarBadgeNavbar();
        
        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('notificacaoCriada', { detail: notificacao }));

        return notificacao;
    }

    // Alertas automáticos do sistema
    verificarAlertasSistema() {
        this.verificarPrazosProcessos();
        this.verificarOcorrenciasGraves();
        this.verificarBackups();
        this.verificarSistema();
    }

    verificarPrazosProcessos() {
        if (!this.config.alertas.processosPrazos) return;

        const processos = db.getProcessos();
        const hoje = new Date();
        
        processos.forEach(processo => {
            if (processo.status === 'em_andamento') {
                const prazo = new Date(processo.prazo);
                const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
                
                if (diasRestantes <= 3 && diasRestantes > 0) {
                    // Verificar se já existe notificação para este processo
                    const notificacoesExistentes = this.getNotificacoes();
                    const jaNotificado = notificacoesExistentes.some(n => 
                        n.dados && n.dados.processoId === processo.id && 
                        n.tipo === 'processo' && 
                        new Date(n.data) > new Date(hoje.getTime() - (24 * 60 * 60 * 1000))
                    );

                    if (!jaNotificado) {
                        this.criarNotificacao({
                            titulo: `Prazo próximo do processo ${processo.numero}`,
                            mensagem: `O processo ${processo.numero} vence em ${diasRestantes} dias.`,
                            tipo: 'processo',
                            prioridade: 'alta',
                            categoria: 'prazo',
                            acao: 'ver_processo',
                            dados: { processoId: processo.id }
                        });
                    }
                } else if (diasRestantes <= 0) {
                    this.criarNotificacao({
                        titulo: `Prazo expirado do processo ${processo.numero}`,
                        mensagem: `O processo ${processo.numero} está com prazo expirado.`,
                        tipo: 'processo',
                        prioridade: 'urgente',
                        categoria: 'prazo',
                        acao: 'ver_processo',
                        dados: { processoId: processo.id }
                    });
                }
            }
        });
    }

    verificarOcorrenciasGraves() {
        if (!this.config.alertas.ocorrenciasGraves) return;

        const ocorrencias = db.getOcorrencias();
        const hoje = new Date();
        const ultimas24h = new Date(hoje.getTime() - (24 * 60 * 60 * 1000));
        
        const ocorrenciasGraves = ocorrencias.filter(o => 
            (o.tipo === 'grave' || o.tipo === 'gravissima') && 
            new Date(o.dataRegistro) > ultimas24h
        );

        if (ocorrenciasGraves.length > 0) {
            this.criarNotificacao({
                titulo: `${ocorrenciasGraves.length} ocorrência(s) grave(s) nas últimas 24h`,
                mensagem: 'Foram registradas ocorrências graves que requerem atenção.',
                tipo: 'aluno',
                prioridade: 'alta',
                categoria: 'seguranca',
                acao: 'ver_ocorrencias'
            });
        }
    }

    verificarBackups() {
        if (!this.config.alertas.backupFalha) return;

        const backups = backupSystem.getBackups();
        if (backups.length === 0) {
            this.criarNotificacao({
                titulo: 'Nenhum backup realizado',
                mensagem: 'É recomendável realizar o primeiro backup do sistema.',
                tipo: 'backup',
                prioridade: 'alta',
                categoria: 'backup',
                acao: 'realizar_backup'
            });
        } else {
            const ultimoBackup = new Date(backups[0].metadata.dataCriacao);
            const hoje = new Date();
            const diferencaDias = Math.floor((hoje - ultimoBackup) / (1000 * 60 * 60 * 24));
            
            if (diferencaDias > 7) {
                this.criarNotificacao({
                    titulo: 'Backup desatualizado',
                    mensagem: `O último backup foi realizado há ${diferencaDias} dias.`,
                    tipo: 'backup',
                    prioridade: 'normal',
                    categoria: 'backup',
                    acao: 'realizar_backup'
                });
            }
        }
    }

    verificarSistema() {
        // Verificar uso de armazenamento
        const tamanhoTotal = this.calcularTamanhoLocalStorage();
        if (tamanhoTotal > 5) { // Mais de 5MB
            this.criarNotificacao({
                titulo: 'Armazenamento elevado',
                mensagem: `O sistema está usando ${tamanhoTotal.toFixed(2)}MB de armazenamento. Considere limpar dados antigos.`,
                tipo: 'sistema',
                prioridade: 'normal',
                categoria: 'sistema'
            });
        }
    }

    // Gerenciamento de notificações
    getNotificacoes(filtros = {}) {
        let notificacoes = JSON.parse(localStorage.getItem(this.notificationsKey)) || [];
        
        // Aplicar filtros
        if (filtros.tipo && filtros.tipo !== 'todos') {
            notificacoes = notificacoes.filter(n => n.tipo === filtros.tipo);
        }
        
        if (filtros.prioridade && filtros.prioridade !== 'todas') {
            notificacoes = notificacoes.filter(n => n.prioridade === filtros.prioridade);
        }
        
        if (filtros.status && filtros.status !== 'todos') {
            if (filtros.status === 'nao_lida') {
                notificacoes = notificacoes.filter(n => !n.lida);
            } else if (filtros.status === 'lida') {
                notificacoes = notificacoes.filter(n => n.lida);
            } else if (filtros.status === 'arquivada') {
                notificacoes = notificacoes.filter(n => n.arquivada);
            }
        }
        
        return notificacoes;
    }

    marcarComoLida(notificacaoId) {
        const notificacoes = this.getNotificacoes();
        const notificacao = notificacoes.find(n => n.id === notificacaoId);
        
        if (notificacao && !notificacao.lida) {
            notificacao.lida = true;
            localStorage.setItem(this.notificationsKey, JSON.stringify(notificacoes));
            this.atualizarBadgeNavbar();
            // Atualizar no Firestore se disponível
            if (this.useFirestore && this.db) {
                try {
                    this.db.collection('notifications').doc(notificacaoId).update({ lida: true }).catch(() => {});
                } catch (e) {
                    console.warn('marcarComoLida firestore erro:', e);
                }
            }
            return true;
        }
        
        return false;
    }

    marcarTodasComoLidas() {
        const notificacoes = this.getNotificacoes();
        notificacoes.forEach(notificacao => {
            notificacao.lida = true;
        });
        
        localStorage.setItem(this.notificationsKey, JSON.stringify(notificacoes));
        this.atualizarBadgeNavbar();
        this.atualizarInterface();
        
        this.mostrarMensagem('Todas as notificações marcadas como lidas.', 'success');
        // Atualizar no Firestore (melhor esforço)
        if (this.useFirestore && this.db) {
            try {
                const batch = this.db.batch ? this.db.batch() : null;
                notificacoes.forEach(n => {
                    const ref = this.db.collection('notifications').doc(n.id);
                    if (batch) batch.update(ref, { lida: true });
                    else ref.update({ lida: true }).catch(() => {});
                });
                if (batch) batch.commit().catch(() => {});
            } catch (e) {
                console.warn('marcarTodasComoLidas firestore erro:', e);
            }
        }
    }

    arquivarNotificacao(notificacaoId) {
        const notificacoes = this.getNotificacoes();
        const notificacao = notificacoes.find(n => n.id === notificacaoId);
        
        if (notificacao) {
            notificacao.arquivada = true;
            localStorage.setItem(this.notificationsKey, JSON.stringify(notificacoes));
            this.atualizarInterface();
            // Atualizar no Firestore
            if (this.useFirestore && this.db) {
                try {
                    this.db.collection('notifications').doc(notificacaoId).update({ arquivada: true }).catch(() => {});
                } catch (e) {
                    console.warn('arquivarNotificacao firestore erro:', e);
                }
            }
            return true;
        }
        
        return false;
    }

    excluirNotificacao(notificacaoId) {
        const notificacoes = this.getNotificacoes();
        const index = notificacoes.findIndex(n => n.id === notificacaoId);
        
        if (index !== -1) {
            notificacoes.splice(index, 1);
            localStorage.setItem(this.notificationsKey, JSON.stringify(notificacoes));
            this.atualizarBadgeNavbar();
            this.atualizarInterface();
            // Remover do Firestore (melhor esforço)
            if (this.useFirestore && this.db) {
                try {
                    this.db.collection('notifications').doc(notificacaoId).delete().catch(() => {});
                } catch (e) {
                    console.warn('excluirNotificacao firestore erro:', e);
                }
            }
            return true;
        }
        
        return false;
    }

    limparNotificacoes() {
        if (confirm('Tem certeza que deseja limpar todas as notificações?')) {
            const todas = this.getNotificacoes();
            localStorage.setItem(this.notificationsKey, JSON.stringify([]));
            this.atualizarBadgeNavbar();
            this.atualizarInterface();
            this.mostrarMensagem('Todas as notificações foram removidas.', 'success');
            // Remover do Firestore (melhor esforço)
            if (this.useFirestore && this.db) {
                try {
                    const batch = this.db.batch ? this.db.batch() : null;
                    todas.forEach(n => {
                        const ref = this.db.collection('notifications').doc(n.id);
                        if (batch) batch.delete(ref);
                        else ref.delete().catch(() => {});
                    });
                    if (batch) batch.commit().catch(() => {});
                } catch (e) {
                    console.warn('limparNotificacoes firestore erro:', e);
                }
            }
        }
    }

    // Interface
    atualizarInterface(filtros = {}) {
        this.atualizarEstatisticas();
        this.atualizarListaNotificacoes(filtros);
    }

    atualizarEstatisticas() {
        const notificacoes = this.getNotificacoes();
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        const urgentes = notificacoes.filter(n => n.prioridade === 'urgente' && !n.lida).length;
        const hoje = notificacoes.filter(n => this.isHoje(n.data)).length;
        const alunos = notificacoes.filter(n => n.tipo === 'aluno').length;
        const processos = notificacoes.filter(n => n.tipo === 'processo').length;

        this.atualizarElementoTexto('totalNotificacoes', notificacoes.length);
        this.atualizarElementoTexto('naoLidasNotificacoes', naoLidas);
        this.atualizarElementoTexto('urgentesNotificacoes', urgentes);
        this.atualizarElementoTexto('hojeNotificacoes', hoje);
        this.atualizarElementoTexto('alunosNotificacoes', alunos);
        this.atualizarElementoTexto('processosNotificacoes', processos);
    }

    atualizarListaNotificacoes(filtros = {}) {
        const notificacoes = this.getNotificacoes(filtros);
        const container = document.getElementById('listaNotificacoes');
        if (!container) return;
        
        if (notificacoes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">Nenhuma notificação encontrada</h5>
                    <p class="text-muted">Todas as notificações aparecerão aqui.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notificacoes.map(notificacao => {
            const data = new Date(notificacao.data);
            const dataFormatada = data.toLocaleString('pt-BR');
            const tempoDecorrido = this.calcularTempoDecorrido(data);
            
            const classes = [
                'notification-item',
                'd-flex',
                'align-items-start',
                notificacao.lida ? 'lida' : 'nao-lida',
                notificacao.prioridade === 'urgente' ? 'urgente' : '',
                notificacao.prioridade === 'alta' ? 'critica' : ''
            ].filter(Boolean).join(' ');
            
            return `
                <div class="${classes}" onclick="notificationSystem.verDetalhesNotificacao('${notificacao.id}')">
                    <div class="notification-icon ${notificacao.tipo}">
                        <i class="${this.getIconeNotificacao(notificacao.tipo)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notificacao.titulo}</div>
                        <div class="notification-message">${notificacao.mensagem}</div>
                        <div class="notification-meta">
                            <span class="badge notification-badge bg-${this.getCorPrioridade(notificacao.prioridade)}">
                                ${notificacao.prioridade}
                            </span>
                            <span class="ms-2">${tempoDecorrido}</span>
                        </div>
                    </div>
                    <div class="notification-actions ms-3">
                        ${!notificacao.lida ? `
                            <button class="btn btn-sm btn-outline-success" onclick="event.stopPropagation(); notificationSystem.marcarComoLida('${notificacao.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); notificationSystem.excluirNotificacao('${notificacao.id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    verDetalhesNotificacao(notificacaoId) {
        const notificacao = this.getNotificacoes().find(n => n.id === notificacaoId);
        if (!notificacao) return;

        // Marcar como lida ao visualizar
        if (!notificacao.lida) {
            this.marcarComoLida(notificacaoId);
        }

        this.atualizarElementoTexto('tituloDetalhesNotificacao', notificacao.titulo);
        this.atualizarElementoTexto('detalhesDataNotificacao', new Date(notificacao.data).toLocaleString('pt-BR'));
        this.atualizarElementoHTML('detalhesPrioridadeNotificacao', 
            `<span class="badge bg-${this.getCorPrioridade(notificacao.prioridade)}">${notificacao.prioridade}</span>`);
        this.atualizarElementoTexto('detalhesCategoriaNotificacao', notificacao.categoria);
        this.atualizarElementoTexto('detalhesMensagemNotificacao', notificacao.mensagem);

        // Ações específicas
        const acoesContainer = document.getElementById('detalhesAcoesNotificacao');
        if (acoesContainer) {
            acoesContainer.innerHTML = this.gerarAcoesNotificacao(notificacao);
        }

        const modal = new bootstrap.Modal(document.getElementById('modalDetalhesNotificacao'));
        modal.show();
    }

    // Toast notifications
    mostrarToast(notificacao) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toastId = `toast-${notificacao.id}`;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-notification ${notificacao.prioridade} show`;
        toast.id = toastId;
        toast.innerHTML = `
            <div class="toast-header">
                <i class="${this.getIconeNotificacao(notificacao.tipo)} me-2 text-${this.getCorPrioridade(notificacao.prioridade)}"></i>
                <strong class="me-auto">${notificacao.titulo}</strong>
                <small class="text-muted">agora</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${notificacao.mensagem}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 5000);
    }

    // Badge na navbar
    atualizarBadgeNavbar() {
        const notificacoes = this.getNotificacoes();
        const naoLidas = notificacoes.filter(n => !n.lida).length;
        const badge = document.getElementById('badgeNotificacoesNavbar');
        
        if (badge) {
            if (naoLidas > 0) {
                badge.textContent = naoLidas;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Utilitários
    gerarIdNotificacao() {
        return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getIconeNotificacao(tipo) {
        const icones = {
            sistema: 'fas fa-cog',
            aluno: 'fas fa-user-graduate',
            processo: 'fas fa-gavel',
            seguranca: 'fas fa-shield-alt',
            backup: 'fas fa-database'
        };
        return icones[tipo] || 'fas fa-bell';
    }

    getCorPrioridade(prioridade) {
        const cores = {
            baixa: 'success',
            normal: 'primary',
            alta: 'warning',
            urgente: 'danger'
        };
        return cores[prioridade] || 'primary';
    }

    calcularTempoDecorrido(data) {
        const agora = new Date();
        const diferenca = agora - new Date(data);
        
        const minutos = Math.floor(diferenca / (1000 * 60));
        const horas = Math.floor(diferenca / (1000 * 60 * 60));
        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        
        if (minutos < 1) return 'agora';
        if (minutos < 60) return `${minutos} min atrás`;
        if (horas < 24) return `${horas} h atrás`;
        if (dias === 1) return 'ontem';
        return `${dias} dias atrás`;
    }

    isHoje(dataString) {
        const data = new Date(dataString);
        const hoje = new Date();
        return data.toDateString() === hoje.toDateString();
    }

    calcularTamanhoLocalStorage() {
        let tamanhoTotal = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                tamanhoTotal += localStorage[key].length;
            }
        }
        return tamanhoTotal / (1024 * 1024); // Converter para MB
    }

    gerarAcoesNotificacao(notificacao) {
        if (!notificacao.acao) return '';
        
        const acoes = {
            ver_processo: `
                <button class="btn btn-primary btn-sm" onclick="verProcesso('${notificacao.dados.processoId}')">
                    <i class="fas fa-external-link-alt me-1"></i>Ver Processo
                </button>
            `,
            ver_ocorrencias: `
                <button class="btn btn-primary btn-sm" onclick="app.mostrarSecao('ocorrencias')">
                    <i class="fas fa-external-link-alt me-1"></i>Ver Ocorrências
                </button>
            `,
            realizar_backup: `
                <button class="btn btn-primary btn-sm" onclick="app.mostrarSecao('backup'); realizarBackup()">
                    <i class="fas fa-external-link-alt me-1"></i>Realizar Backup
                </button>
            `
        };
        
        return acoes[notificacao.acao] || '';
    }

    // Auto-refresh
    iniciarAutoRefresh() {
        if (this.config.autoRefresh) {
            this.autoRefreshInterval = setInterval(() => {
                this.verificarAlertasSistema();
                this.atualizarBadgeNavbar();
                
                // Atualizar interface se estiver na seção de notificações
                const notificacoesSection = document.getElementById('notificacoes');
                if (notificacoesSection && !notificacoesSection.classList.contains('d-none')) {
                    this.atualizarInterface();
                }
            }, 30000); // A cada 30 segundos
        }
    }

    pararAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    configurarEventListeners() {
        // Auto-refresh toggle
        const autoRefreshToggle = document.getElementById('autoRefreshNotificacoes');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                this.config.autoRefresh = e.target.checked;
                this.salvarConfiguracoes();
                
                if (e.target.checked) {
                    this.iniciarAutoRefresh();
                } else {
                    this.pararAutoRefresh();
                }
            });
        }
    }

    // Utilitários de interface
    atualizarElementoTexto(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = texto;
        }
    }

    atualizarElementoHTML(id, html) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.innerHTML = html;
        }
    }

    // Mensagens
    mostrarMensagem(mensagem, tipo = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        toast.innerHTML = `
            <i class="fas fa-${this.getIconeMensagem(tipo)} me-2"></i>
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    getIconeMensagem(tipo) {
        const icones = {
            'success': 'check-circle',
            'danger': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icones[tipo] || 'info-circle';
    }
}

// Funções globais
function aplicarFiltrosNotificacoes() {
    if (typeof notificationSystem !== 'undefined') {
        const filtros = {
            tipo: document.getElementById('filtroTipoNotificacao').value,
            prioridade: document.getElementById('filtroPrioridadeNotificacao').value,
            status: document.getElementById('filtroStatusNotificacao').value
        };
        
        notificationSystem.atualizarInterface(filtros);
    }
}

function limparFiltrosNotificacoes() {
    document.getElementById('filtroTipoNotificacao').value = 'todos';
    document.getElementById('filtroPrioridadeNotificacao').value = 'todas';
    document.getElementById('filtroStatusNotificacao').value = 'todos';
    
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.atualizarInterface();
    }
}

function marcarTodasComoLidas() {
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.marcarTodasComoLidas();
    }
}

function limparNotificacoes() {
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.limparNotificacoes();
    }
}

function salvarConfiguracoesAlertas() {
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.config.email = document.getElementById('alertasEmail').checked;
        notificationSystem.config.sistema = document.getElementById('alertasSistema').checked;
        notificationSystem.config.sonoros = document.getElementById('alertasSonoros').checked;
        
        notificationSystem.salvarConfiguracoes();
        notificationSystem.mostrarMensagem('Configurações salvas com sucesso!', 'success');
    }
}

function marcarComoLidaModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalDetalhesNotificacao'));
    modal.hide();
    
    if (typeof notificationSystem !== 'undefined') {
        notificationSystem.mostrarMensagem('Notificação marcada como lida.', 'success');
    }
}

// Inicializar sistema de notificações
const notificationSystem = new NotificationSystem();