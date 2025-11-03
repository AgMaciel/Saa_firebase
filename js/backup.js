/**
 * SAA - Sistema de Gestão Discente
 * Sistema de Backup e Restauração
 * Versão: 1.0.0
 */

class BackupSystem {
    constructor() {
        this.backupKey = 'saa_backups';
        this.configKey = 'saa_backup_config';
        this.autoBackupInterval = null;
        this.init();
    }

    init() {
        this.carregarConfiguracoes();
        this.verificarBackupAutomatico();
        this.atualizarInterface();
        console.log('💾 Backup System inicializado');
    }

    carregarConfiguracoes() {
        const configSalva = localStorage.getItem(this.configKey);
        if (configSalva) {
            this.config = JSON.parse(configSalva);
        } else {
            this.config = {
                autoBackup: false,
                frequencia: 'semanal',
                manterBackups: 10,
                itensBackup: {
                    alunos: true,
                    ocorrencias: true,
                    processos: true,
                    usuarios: true,
                    configuracoes: true
                },
                ultimoBackupAuto: null,
                proximoBackupAuto: null
            };
            this.salvarConfiguracoes();
        }
    }

    salvarConfiguracoes() {
        localStorage.setItem(this.configKey, JSON.stringify(this.config));
        this.atualizarInterface();
    }

    realizarBackup(nomePersonalizado = null) {
        return new Promise((resolve, reject) => {
            try {
                this.mostrarProgresso('backup', 'Iniciando backup...');
                
                const backupData = {
                    metadata: {
                        id: this.gerarIdBackup(),
                        nome: nomePersonalizado || `Backup_${new Date().toLocaleString('pt-BR').replace(/[/:\\]/g, '-')}`,
                        dataCriacao: new Date().toISOString(),
                        versaoSistema: '1.0.0',
                        tipo: 'manual'
                    },
                    dados: {}
                };

                // Coletar dados baseado nas configurações
                setTimeout(() => {
                    this.atualizarProgresso(25, 'Coletando dados dos alunos...');
                    
                    if (this.config.itensBackup.alunos) {
                        backupData.dados.alunos = db.getAlunos();
                    }

                    setTimeout(() => {
                        this.atualizarProgresso(50, 'Coletando ocorrências...');
                        
                        if (this.config.itensBackup.ocorrencias) {
                            backupData.dados.ocorrencias = db.getOcorrencias();
                        }

                        setTimeout(() => {
                            this.atualizarProgresso(75, 'Coletando processos disciplinares...');
                            
                            if (this.config.itensBackup.processos) {
                                backupData.dados.processos = db.getProcessos();
                            }

                            setTimeout(() => {
                                this.atualizarProgresso(90, 'Coletando configurações...');
                                
                                if (this.config.itensBackup.usuarios) {
                                    backupData.dados.usuarios = db.getUsers();
                                }
                                
                                if (this.config.itensBackup.configuracoes) {
                                    backupData.dados.configuracoes = {
                                        backup: this.config,
                                        sistema: this.getConfiguracoesSistema()
                                    };
                                }

                                // Calcular tamanho
                                backupData.metadata.tamanho = this.calcularTamanhoBackup(backupData);
                                backupData.metadata.totalItens = this.contarItensBackup(backupData);

                                // Salvar backup
                                this.salvarBackup(backupData);
                                
                                this.atualizarProgresso(100, 'Backup concluído com sucesso!');
                                
                                setTimeout(() => {
                                    this.esconderProgresso();
                                    this.atualizarInterface();
                                    this.mostrarMensagem('Backup realizado com sucesso!', 'success');
                                    resolve(backupData);
                                }, 1000);

                            }, 500);
                        }, 500);
                    }, 500);
                }, 500);

            } catch (error) {
                this.esconderProgresso();
                this.mostrarMensagem('Erro ao realizar backup: ' + error.message, 'danger');
                reject(error);
            }
        });
    }

    salvarBackup(backupData) {
        const backups = this.getBackups();
        backups.unshift(backupData); // Adicionar no início
        
        // Limitar número de backups conforme configuração
        if (this.config.manterBackups > 0) {
            while (backups.length > this.config.manterBackups) {
                backups.pop(); // Remover backups mais antigos
            }
        }
        
        localStorage.setItem(this.backupKey, JSON.stringify(backups));
    }

    getBackups() {
        return JSON.parse(localStorage.getItem(this.backupKey)) || [];
    }

    restaurarBackup(backupId, opcoesRestauracao = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.mostrarProgresso('restore', 'Iniciando restauração...');
                
                const backups = this.getBackups();
                const backup = backups.find(b => b.metadata.id === backupId);
                
                if (!backup) {
                    throw new Error('Backup não encontrado');
                }

                // Fazer backup atual se solicitado
                if (opcoesRestauracao.backupAtual) {
                    this.realizarBackup('Backup_pre_restauracao');
                }

                setTimeout(() => {
                    this.atualizarProgresso(25, 'Restaurando dados dos alunos...');
                    
                    if (opcoesRestauracao.alunos && backup.dados.alunos) {
                        localStorage.setItem('saa_alunos', JSON.stringify(backup.dados.alunos));
                    }

                    setTimeout(() => {
                        this.atualizarProgresso(50, 'Restaurando ocorrências...');
                        
                        if (opcoesRestauracao.ocorrencias && backup.dados.ocorrencias) {
                            localStorage.setItem('saa_ocorrencias', JSON.stringify(backup.dados.ocorrencias));
                        }

                        setTimeout(() => {
                            this.atualizarProgresso(75, 'Restaurando processos...');
                            
                            if (opcoesRestauracao.processos && backup.dados.processos) {
                                localStorage.setItem('saa_processos', JSON.stringify(backup.dados.processos));
                            }

                            setTimeout(() => {
                                this.atualizarProgresso(90, 'Restaurando configurações...');
                                
                                if (opcoesRestauracao.usuarios && backup.dados.usuarios) {
                                    localStorage.setItem('saa_users', JSON.stringify(backup.dados.usuarios));
                                }
                                
                                if (opcoesRestauracao.configuracoes && backup.dados.configuracoes) {
                                    // Restaurar configurações específicas
                                    if (backup.dados.configuracoes.backup) {
                                        localStorage.setItem(this.configKey, JSON.stringify(backup.dados.configuracoes.backup));
                                        this.carregarConfiguracoes();
                                    }
                                }

                                this.atualizarProgresso(100, 'Restauração concluída!');
                                
                                setTimeout(() => {
                                    this.esconderProgresso();
                                    this.mostrarMensagem('Restauração concluída com sucesso!', 'success');
                                    
                                    // Recarregar a página para aplicar as mudanças
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 2000);
                                    
                                    resolve();
                                }, 1000);

                            }, 500);
                        }, 500);
                    }, 500);
                }, 500);

            } catch (error) {
                this.esconderProgresso();
                this.mostrarMensagem('Erro ao restaurar backup: ' + error.message, 'danger');
                reject(error);
            }
        });
    }

    excluirBackup(backupId) {
        const backups = this.getBackups();
        const backupIndex = backups.findIndex(b => b.metadata.id === backupId);
        
        if (backupIndex !== -1) {
            backups.splice(backupIndex, 1);
            localStorage.setItem(this.backupKey, JSON.stringify(backups));
            this.atualizarInterface();
            this.mostrarMensagem('Backup excluído com sucesso!', 'success');
            return true;
        }
        
        return false;
    }

    exportarBackup(backupId) {
        const backups = this.getBackups();
        const backup = backups.find(b => b.metadata.id === backupId);
        
        if (backup) {
            const blob = new Blob([JSON.stringify(backup, null, 2)], { 
                type: 'application/json' 
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_saa_${backup.metadata.nome}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.mostrarMensagem('Backup exportado com sucesso!', 'success');
            return true;
        }
        
        return false;
    }

    importarBackup(arquivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // Validar estrutura do backup
                    if (!backupData.metadata || !backupData.dados) {
                        throw new Error('Arquivo de backup inválido');
                    }
                    
                    // Adicionar ao sistema
                    backupData.metadata.id = this.gerarIdBackup();
                    backupData.metadata.dataImportacao = new Date().toISOString();
                    backupData.metadata.tipo = 'importado';
                    
                    this.salvarBackup(backupData);
                    this.atualizarInterface();
                    this.mostrarMensagem('Backup importado com sucesso!', 'success');
                    resolve(backupData);
                    
                } catch (error) {
                    this.mostrarMensagem('Erro ao importar backup: ' + error.message, 'danger');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                this.mostrarMensagem('Erro ao ler arquivo', 'danger');
                reject(new Error('Erro ao ler arquivo'));
            };
            
            reader.readAsText(arquivo);
        });
    }

    // Backup Automático
    verificarBackupAutomatico() {
        if (this.config.autoBackup) {
            this.iniciarBackupAutomatico();
        } else {
            this.pararBackupAutomatico();
        }
    }

    iniciarBackupAutomatico() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
        }

        const intervalo = this.calcularIntervaloBackup();
        this.autoBackupInterval = setInterval(() => {
            this.realizarBackup(`Backup_auto_${new Date().toLocaleDateString('pt-BR')}`);
            this.config.ultimoBackupAuto = new Date().toISOString();
            this.config.proximoBackupAuto = new Date(Date.now() + intervalo).toISOString();
            this.salvarConfiguracoes();
        }, intervalo);

        console.log('🔄 Backup automático iniciado');
    }

    pararBackupAutomatico() {
        if (this.autoBackupInterval) {
            clearInterval(this.autoBackupInterval);
            this.autoBackupInterval = null;
        }
        console.log('⏹️ Backup automático parado');
    }

    calcularIntervaloBackup() {
        const intervalos = {
            diario: 24 * 60 * 60 * 1000, // 1 dia
            semanal: 7 * 24 * 60 * 60 * 1000, // 7 dias
            quinzenal: 15 * 24 * 60 * 60 * 1000, // 15 dias
            mensal: 30 * 24 * 60 * 60 * 1000 // 30 dias
        };
        
        return intervalos[this.config.frequencia] || intervalos.semanal;
    }

    // Utilitários
    gerarIdBackup() {
        return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calcularTamanhoBackup(backupData) {
        const jsonString = JSON.stringify(backupData);
        const bytes = new Blob([jsonString]).size;
        return (bytes / 1024 / 1024).toFixed(2); // MB
    }

    contarItensBackup(backupData) {
        let total = 0;
        Object.values(backupData.dados).forEach(dados => {
            if (Array.isArray(dados)) {
                total += dados.length;
            }
        });
        return total;
    }

    getConfiguracoesSistema() {
        return {
            versao: '1.0.0',
            dataInstalacao: this.getDataInstalacao(),
            ultimoAcesso: new Date().toISOString()
        };
    }

    getDataInstalacao() {
        // Tentar obter data de instalação do primeiro backup
        const backups = this.getBackups();
        if (backups.length > 0) {
            return backups[backups.length - 1].metadata.dataCriacao;
        }
        return new Date().toISOString();
    }

    // Interface
    atualizarInterface() {
        this.atualizarEstatisticas();
        this.atualizarListaBackups();
        this.atualizarConfiguracoesInterface();
    }

    atualizarEstatisticas() {
        const backups = this.getBackups();
        
        this.atualizarElementoTexto('totalBackups', backups.length);
        
        if (backups.length > 0) {
            const ultimoBackup = backups[0];
            this.atualizarElementoTexto('ultimoBackup', 
                new Date(ultimoBackup.metadata.dataCriacao).toLocaleDateString('pt-BR'));
        } else {
            this.atualizarElementoTexto('ultimoBackup', 'Nunca');
        }
        
        // Calcular tamanho total
        const tamanhoTotal = backups.reduce((total, backup) => 
            total + parseFloat(backup.metadata.tamanho || 0), 0);
        this.atualizarElementoTexto('tamanhoTotal', tamanhoTotal.toFixed(2) + ' MB');
        
        // Status backup automático
        const statusElement = document.getElementById('statusBackupAuto');
        if (statusElement) {
            statusElement.textContent = this.config.autoBackup ? 'Ativo' : 'Inativo';
            statusElement.className = this.config.autoBackup ? 'text-success' : 'text-warning';
        }
    }

    atualizarListaBackups() {
        const backups = this.getBackups();
        const tbody = document.getElementById('tabelaBackups');
        const select = document.getElementById('selectBackupRestaurar');
        
        if (tbody) {
            tbody.innerHTML = '';
        }
        if (select) {
            select.innerHTML = '<option value="">Selecione um backup...</option>';
        }
        
        if (backups.length === 0) {
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">
                            <i class="fas fa-database fa-2x mb-2 d-block"></i>
                            Nenhum backup realizado
                        </td>
                    </tr>
                `;
            }
            return;
        }

        backups.forEach(backup => {
            const data = new Date(backup.metadata.dataCriacao);
            const dataFormatada = data.toLocaleString('pt-BR');
            
            // Adicionar à tabela
            if (tbody) {
                tbody.innerHTML += `
                    <tr>
                        <td>${dataFormatada}</td>
                        <td>${backup.metadata.tamanho} MB</td>
                        <td>${backup.metadata.totalItens} itens</td>
                        <td><span class="badge bg-info">${backup.metadata.tipo}</span></td>
                        <td><span class="badge bg-success">Concluído</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="backupSystem.exportarBackup('${backup.metadata.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="backupSystem.excluirBackup('${backup.metadata.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }
            
            // Adicionar ao select
            if (select) {
                select.innerHTML += `
                    <option value="${backup.metadata.id}">
                        ${backup.metadata.nome} (${dataFormatada})
                    </option>
                `;
            }
        });
    }

    atualizarConfiguracoesInterface() {
        const toggleAutoBackup = document.getElementById('toggleAutoBackup');
        const frequenciaBackup = document.getElementById('frequenciaBackup');
        const manterBackups = document.getElementById('manterBackups');
        
        if (toggleAutoBackup) toggleAutoBackup.checked = this.config.autoBackup;
        if (frequenciaBackup) frequenciaBackup.value = this.config.frequencia;
        if (manterBackups) manterBackups.value = this.config.manterBackups;
        
        // Checkboxes de itens
        Object.keys(this.config.itensBackup).forEach(item => {
            const checkbox = document.getElementById(`backup${this.capitalizeFirstLetter(item)}`);
            if (checkbox) {
                checkbox.checked = this.config.itensBackup[item];
            }
        });
    }

    // Progresso
    mostrarProgresso(tipo, mensagem) {
        const titulo = document.getElementById('tituloProgressoBackup');
        const texto = document.getElementById('textoProgressoBackup');
        
        if (titulo) titulo.textContent = tipo === 'backup' ? 'Realizando Backup' : 'Restaurando Backup';
        if (texto) texto.textContent = mensagem;
        
        this.atualizarProgresso(0, mensagem);
        
        const modal = new bootstrap.Modal(document.getElementById('modalProgressoBackup'));
        modal.show();
    }

    atualizarProgresso(percentual, mensagem) {
        const progressoBar = document.getElementById('progressoBackupBar');
        const textoProgresso = document.getElementById('textoProgressoBackup');
        
        if (progressoBar) progressoBar.style.width = percentual + '%';
        if (textoProgresso) textoProgresso.textContent = mensagem;
    }

    esconderProgresso() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalProgressoBackup'));
        if (modal) {
            modal.hide();
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

    // Utilitários de interface
    atualizarElementoTexto(id, texto) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = texto;
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
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

    // Limpeza
    limparBackupsAntigos() {
        const backups = this.getBackups();
        const manter = this.config.manterBackups;
        
        if (manter > 0 && backups.length > manter) {
            const backupsParaManter = backups.slice(0, manter);
            localStorage.setItem(this.backupKey, JSON.stringify(backupsParaManter));
            this.atualizarInterface();
            this.mostrarMensagem(`${backups.length - manter} backups antigos removidos.`, 'success');
        } else {
            this.mostrarMensagem('Nenhum backup antigo para remover.', 'info');
        }
    }

    exportarDadosCompletos() {
        this.realizarBackup('Exportacao_completa').then(backup => {
            this.exportarBackup(backup.metadata.id);
        });
    }

    limparDadosSistema() {
        if (confirm('ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema. Esta operação não pode ser desfeita. Deseja continuar?')) {
            if (confirm('TEM CERTEZA? Todos os alunos, ocorrências, processos e configurações serão perdidos.')) {
                // Fazer backup final
                this.realizarBackup('Backup_final_antes_limpeza').then(() => {
                    // Limpar dados
                    localStorage.removeItem('saa_alunos');
                    localStorage.removeItem('saa_ocorrencias');
                    localStorage.removeItem('saa_processos');
                    localStorage.removeItem('saa_users');
                    localStorage.removeItem('saa_access_logs');
                    localStorage.removeItem('saa_notifications');
                    
                    this.mostrarMensagem('Todos os dados foram removidos. A página será recarregada.', 'warning');
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                });
            }
        }
    }
}

// Funções globais
function realizarBackup() {
    if (typeof backupSystem !== 'undefined') {
        backupSystem.realizarBackup();
    }
}

function salvarConfiguracoesBackup() {
    if (typeof backupSystem !== 'undefined') {
        backupSystem.config.autoBackup = document.getElementById('toggleAutoBackup').checked;
        backupSystem.config.frequencia = document.getElementById('frequenciaBackup').value;
        backupSystem.config.manterBackups = parseInt(document.getElementById('manterBackups').value);
        
        // Itens de backup
        backupSystem.config.itensBackup = {
            alunos: document.getElementById('backupAlunos').checked,
            ocorrencias: document.getElementById('backupOcorrencias').checked,
            processos: document.getElementById('backupProcessos').checked,
            usuarios: document.getElementById('backupUsuarios').checked,
            configuracoes: document.getElementById('backupConfiguracoes').checked
        };
        
        backupSystem.salvarConfiguracoes();
        backupSystem.verificarBackupAutomatico();
        backupSystem.mostrarMensagem('Configurações salvas com sucesso!', 'success');
    }
}

function iniciarRestauracao() {
    if (typeof backupSystem === 'undefined') return;

    const backupId = document.getElementById('selectBackupRestaurar').value;
    const arquivo = document.getElementById('uploadBackup').files[0];
    
    if (!backupId && !arquivo) {
        backupSystem.mostrarMensagem('Selecione um backup ou faça upload de um arquivo.', 'warning');
        return;
    }
    
    const opcoes = {
        alunos: document.getElementById('restaurarAlunos').checked,
        ocorrencias: document.getElementById('restaurarOcorrencias').checked,
        processos: document.getElementById('restaurarProcessos').checked,
        usuarios: document.getElementById('restaurarUsuarios').checked,
        configuracoes: document.getElementById('restaurarConfiguracoes').checked,
        backupAtual: document.getElementById('backupAntesRestaurar').checked
    };
    
    if (backupId) {
        backupSystem.restaurarBackup(backupId, opcoes);
    } else if (arquivo) {
        backupSystem.importarBackup(arquivo).then(() => {
            // Após importar, restaurar o backup recém-importado
            const backups = backupSystem.getBackups();
            const backupRecente = backups[0];
            backupSystem.restaurarBackup(backupRecente.metadata.id, opcoes);
        });
    }
}

function limparBackupsAntigos() {
    if (typeof backupSystem !== 'undefined') {
        backupSystem.limparBackupsAntigos();
    }
}

function exportarDadosCompletos() {
    if (typeof backupSystem !== 'undefined') {
        backupSystem.exportarDadosCompletos();
    }
}

function limparDadosSistema() {
    if (typeof backupSystem !== 'undefined') {
        backupSystem.limparDadosSistema();
    }
}

// Inicializar sistema de backup
const backupSystem = new BackupSystem();