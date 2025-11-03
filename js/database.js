/**
 * SAA - Sistema de Gestão Discente
 * Gerenciamento de Banco de Dados Local (LocalStorage)
 * Versão: 1.0.0
 */

class Database {
    constructor() {
        this.init();
    }

    init() {
        // Inicializar collections se não existirem
        const collections = [
            'saa_alunos',
            'saa_ocorrencias', 
            'saa_processos',
            'saa_users',
            'saa_access_logs',
            'saa_backups',
            'saa_backup_config',
            'saa_notifications',
            'saa_notifications_config'
        ];

        collections.forEach(collection => {
            if (!localStorage.getItem(collection)) {
                localStorage.setItem(collection, JSON.stringify([]));
            }
        });

        console.log('✅ Banco de dados inicializado');
    }

    // ==================== ALUNOS ====================
    getAlunos() {
        return JSON.parse(localStorage.getItem('saa_alunos')) || [];
    }

    salvarAluno(aluno) {
        const alunos = this.getAlunos();
        aluno.id = this.gerarId();
        aluno.dataCadastro = new Date().toISOString();
        aluno.status = 'ativo';
        alunos.push(aluno);
        localStorage.setItem('saa_alunos', JSON.stringify(alunos));
        return aluno;
    }

    atualizarAluno(alunoId, dadosAtualizados) {
        const alunos = this.getAlunos();
        const index = alunos.findIndex(a => a.id === alunoId);
        if (index !== -1) {
            alunos[index] = { ...alunos[index], ...dadosAtualizados };
            localStorage.setItem('saa_alunos', JSON.stringify(alunos));
            return alunos[index];
        }
        return null;
    }

    excluirAluno(alunoId) {
        const alunos = this.getAlunos();
        const index = alunos.findIndex(a => a.id === alunoId);
        if (index !== -1) {
            const alunoRemovido = alunos.splice(index, 1)[0];
            localStorage.setItem('saa_alunos', JSON.stringify(alunos));
            return alunoRemovido;
        }
        return null;
    }

    // ==================== OCORRÊNCIAS ====================
    getOcorrencias() {
        return JSON.parse(localStorage.getItem('saa_ocorrencias')) || [];
    }

    salvarOcorrencia(ocorrencia) {
        const ocorrencias = this.getOcorrencias();
        ocorrencia.id = this.gerarId();
        ocorrencia.dataRegistro = new Date().toISOString();
        ocorrencias.push(ocorrencia);
        localStorage.setItem('saa_ocorrencias', JSON.stringify(ocorrencias));
        return ocorrencia;
    }

    // ==================== PROCESSOS DISCIPLINARES ====================
    getProcessos() {
        return JSON.parse(localStorage.getItem('saa_processos')) || [];
    }

    salvarProcesso(processo) {
        const processos = this.getProcessos();
        processo.id = this.gerarId();
        processo.numero = this.gerarNumeroProcesso();
        processo.dataAbertura = new Date().toISOString();
        processo.status = 'aberto';
        processo.prazo = this.calcularPrazoProcesso();
        
        // Timeline inicial
        processo.timeline = [{
            data: new Date().toISOString(),
            acao: 'Processo aberto',
            descricao: 'Processo disciplinar iniciado',
            usuario: 'Sistema'
        }];
        
        processos.push(processo);
        localStorage.setItem('saa_processos', JSON.stringify(processos));
        return processo;
    }

    atualizarProcesso(processoAtualizado) {
        const processos = this.getProcessos();
        const index = processos.findIndex(p => p.id === processoAtualizado.id);
        if (index !== -1) {
            processos[index] = { ...processos[index], ...processoAtualizado };
            localStorage.setItem('saa_processos', JSON.stringify(processos));
            return processos[index];
        }
        return null;
    }

    adicionarAndamento(processoId, andamento) {
        const processos = this.getProcessos();
        const processo = processos.find(p => p.id === processoId);
        if (processo) {
            andamento.data = new Date().toISOString();
            andamento.id = this.gerarId();
            
            if (!processo.andamentos) processo.andamentos = [];
            processo.andamentos.push(andamento);
            
            // Atualizar timeline
            processo.timeline.push({
                data: andamento.data,
                acao: andamento.tipo,
                descricao: andamento.descricao,
                usuario: 'Sistema'
            });
            
            localStorage.setItem('saa_processos', JSON.stringify(processos));
            return andamento;
        }
        return null;
    }

    // ==================== USUÁRIOS ====================
    getUsers() {
        return JSON.parse(localStorage.getItem('saa_users')) || [];
    }

    updateUser(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            localStorage.setItem('saa_users', JSON.stringify(users));
            return users[index];
        }
        return null;
    }

    createUser(userData) {
        const users = this.getUsers();
        const newUser = {
            id: this.gerarId(),
            ...userData,
            dataCriacao: new Date().toISOString(),
            ativo: true
        };
        users.push(newUser);
        localStorage.setItem('saa_users', JSON.stringify(users));
        return newUser;
    }

    // ==================== LOGS DE ACESSO ====================
    getAccessLogs() {
        return JSON.parse(localStorage.getItem('saa_access_logs')) || [];
    }

    registrarLogAcesso(user) {
        const logs = this.getAccessLogs();
        logs.push({
            userId: user.id,
            username: user.username,
            tipo: user.tipo,
            dataAcesso: new Date().toISOString(),
            ip: 'localhost'
        });
        localStorage.setItem('saa_access_logs', JSON.stringify(logs));
    }

    // ==================== BACKUPS ====================
    getBackups() {
        return JSON.parse(localStorage.getItem('saa_backups')) || [];
    }

    salvarBackup(backupData) {
        const backups = this.getBackups();
        backups.unshift(backupData);
        localStorage.setItem('saa_backups', JSON.stringify(backups));
    }

    // ==================== NOTIFICAÇÕES ====================
    getNotificacoes() {
        return JSON.parse(localStorage.getItem('saa_notifications')) || [];
    }

    salvarNotificacao(notificacao) {
        const notificacoes = this.getNotificacoes();
        notificacoes.unshift(notificacao);
        localStorage.setItem('saa_notifications', JSON.stringify(notificacoes));
    }

    atualizarNotificacao(notificacaoId, updates) {
        const notificacoes = this.getNotificacoes();
        const index = notificacoes.findIndex(n => n.id === notificacaoId);
        if (index !== -1) {
            notificacoes[index] = { ...notificacoes[index], ...updates };
            localStorage.setItem('saa_notifications', JSON.stringify(notificacoes));
            return notificacoes[index];
        }
        return null;
    }

    // ==================== UTILITÁRIOS ====================
    gerarId() {
        return Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
    }

    gerarNumeroProcesso() {
        const ano = new Date().getFullYear();
        const processos = this.getProcessos();
        const sequencial = processos.filter(p => p.dataAbertura.includes(ano)).length + 1;
        return `PROC/${ano}/${sequencial.toString().padStart(4, '0')}`;
    }

    calcularPrazoProcesso() {
        const data = new Date();
        data.setDate(data.getDate() + 20); // 20 dias úteis conforme regulamento
        return data.toISOString();
    }

    // ==================== ESTATÍSTICAS ====================
    getEstatisticas() {
        const alunos = this.getAlunos();
        const ocorrencias = this.getOcorrencias();
        const processos = this.getProcessos();

        return {
            totalAlunos: alunos.length,
            totalOcorrencias: ocorrencias.length,
            totalProcessos: processos.length,
            ocorrenciasPorTipo: {
                leve: ocorrencias.filter(o => o.tipo === 'leve').length,
                grave: ocorrencias.filter(o => o.tipo === 'grave').length,
                gravissima: ocorrencias.filter(o => o.tipo === 'gravissima').length
            },
            processosPorStatus: {
                aberto: processos.filter(p => p.status === 'aberto').length,
                em_andamento: processos.filter(p => p.status === 'em_andamento').length,
                concluido: processos.filter(p => p.status === 'concluido').length,
                arquivado: processos.filter(p => p.status === 'arquivado').length
            }
        };
    }

    // ==================== LIMPEZA E MANUTENÇÃO ====================
    limparDadosAntigos(dias = 365) {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);

        // Limpar logs antigos
        const logs = this.getAccessLogs();
        const logsAtualizados = logs.filter(log => new Date(log.dataAcesso) > dataLimite);
        localStorage.setItem('saa_access_logs', JSON.stringify(logsAtualizados));

        // Limpar notificações antigas
        const notificacoes = this.getNotificacoes();
        const notificacoesAtualizadas = notificacoes.filter(notif => new Date(notif.data) > dataLimite);
        localStorage.setItem('saa_notifications', JSON.stringify(notificacoesAtualizadas));

        return {
            logsRemovidos: logs.length - logsAtualizados.length,
            notificacoesRemovidas: notificacoes.length - notificacoesAtualizadas.length
        };
    }

    // ==================== EXPORTAÇÃO/IMPORTAÇÃO ====================
    exportarDados() {
        return {
            alunos: this.getAlunos(),
            ocorrencias: this.getOcorrencias(),
            processos: this.getProcessos(),
            usuarios: this.getUsers(),
            backups: this.getBackups(),
            notificacoes: this.getNotificacoes(),
            metadata: {
                dataExportacao: new Date().toISOString(),
                versao: '1.0.0',
                totalRegistros: this.getAlunos().length + this.getOcorrencias().length + this.getProcessos().length
            }
        };
    }

    importarDados(dados) {
        try {
            if (dados.alunos) localStorage.setItem('saa_alunos', JSON.stringify(dados.alunos));
            if (dados.ocorrencias) localStorage.setItem('saa_ocorrencias', JSON.stringify(dados.ocorrencias));
            if (dados.processos) localStorage.setItem('saa_processos', JSON.stringify(dados.processos));
            if (dados.usuarios) localStorage.setItem('saa_users', JSON.stringify(dados.usuarios));
            if (dados.backups) localStorage.setItem('saa_backups', JSON.stringify(dados.backups));
            if (dados.notificacoes) localStorage.setItem('saa_notifications', JSON.stringify(dados.notificacoes));
            
            return { success: true, message: 'Dados importados com sucesso' };
        } catch (error) {
            return { success: false, message: 'Erro ao importar dados: ' + error.message };
        }
    }

    // ==================== BACKUP AUTOMÁTICO ====================
    fazerBackupAutomatico() {
        const backupData = this.exportarDados();
        backupData.tipo = 'automatico';
        backupData.nome = `Backup_auto_${new Date().toLocaleDateString('pt-BR')}`;
        
        this.salvarBackup(backupData);
        return backupData;
    }
}

// Instância global do banco de dados
const db = new Database();