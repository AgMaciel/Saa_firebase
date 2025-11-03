/**
 * SAA - Sistema de Gestão Discente
 * Sistema de Relatórios e Estatísticas
 * Versão: 1.0.0
 */

class ReportsManager {
    constructor() {
        this.chartManager = new ChartManager();
        this.init();
    }

    init() {
        console.log('📈 Reports Manager inicializado');
        this.configurarFiltros();
        this.carregarRelatorios();
    }

    configurarFiltros() {
        // Configurar data padrão
        const hoje = new Date();
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(hoje.getDate() - 30);
        
        const dataInicio = document.getElementById('filtroDataInicioRel');
        const dataFim = document.getElementById('filtroDataFimRel');
        
        if (dataInicio && dataFim) {
            dataInicio.value = trintaDiasAtras.toISOString().split('T')[0];
            dataFim.value = hoje.toISOString().split('T')[0];
        }

        // Event listeners
        const periodoSelect = document.getElementById('filtroPeriodo');
        if (periodoSelect) {
            periodoSelect.addEventListener('change', (e) => {
                this.ajustarDatasPorPeriodo(e.target.value);
            });
        }

        const tipoRelatorio = document.getElementById('filtroTipoRelatorio');
        if (tipoRelatorio) {
            tipoRelatorio.addEventListener('change', () => {
                this.carregarRelatorios();
            });
        }
    }

    ajustarDatasPorPeriodo(periodo) {
        const dataInicio = document.getElementById('filtroDataInicioRel');
        const dataFim = document.getElementById('filtroDataFimRel');

        if (!dataInicio || !dataFim || periodo === 'custom') return;

        const hoje = new Date();
        const inicio = new Date();
        
        const periodos = {
            '30': 30,
            '90': 90,
            '180': 180,
            '365': 365
        };

        const dias = periodos[periodo] || 30;
        inicio.setDate(inicio.getDate() - dias);
        
        dataInicio.value = inicio.toISOString().split('T')[0];
        dataFim.value = hoje.toISOString().split('T')[0];
    }

    carregarRelatorios() {
        this.mostrarLoading();
        
        // Simular carregamento
        setTimeout(() => {
            this.atualizarCardsResumo();
            this.atualizarTabelaOcorrencias();
            this.chartManager.atualizarTodosGraficos();
            this.esconderLoading();
        }, 1000);
    }

    atualizarCardsResumo() {
        const ocorrencias = db.getOcorrencias();
        const processos = db.getProcessos();
        const alunos = db.getAlunos();
        const periodo = this.chartManager.getPeriodoFiltro();
        
        const ocorrenciasFiltradas = this.chartManager.filtrarPorPeriodo(ocorrencias, periodo);
        const processosFiltrados = this.chartManager.filtrarPorPeriodo(processos, periodo, 'dataAbertura');
        
        // Totais
        const totalOcorrencias = ocorrenciasFiltradas.length;
        const processosAtivos = processosFiltrados.filter(p => p.status === 'aberto' || p.status === 'em_andamento').length;
        
        // Taxa de resolução (processos concluídos vs total)
        const processosConcluidos = processosFiltrados.filter(p => p.status === 'concluido').length;
        const taxaResolucao = processosFiltrados.length > 0 ? 
            Math.round((processosConcluidos / processosFiltrados.length) * 100) : 0;
        
        // Alunos com ocorrências
        const alunosComOcorrencias = new Set(ocorrenciasFiltradas.map(o => o.alunoId)).size;
        
        // Atualizar cards
        this.atualizarElementoTexto('totalOcorrenciasRel', totalOcorrencias);
        this.atualizarElementoTexto('totalProcessosAtivosRel', processosAtivos);
        this.atualizarElementoTexto('taxaResolucaoRel', taxaResolucao + '%');
        this.atualizarElementoTexto('alunosComOcorrenciasRel', alunosComOcorrencias);
        
        // Calcular variações
        this.calcularVariacoes();
    }

    calcularVariacoes() {
        // Em uma implementação real, compararia com período anterior
        const variacoes = {
            ocorrencias: '+12%',
            processos: '-5%',
            resolucao: '+8%',
            alunos: '+3%'
        };
        
        this.atualizarElementoHTML('variacaoOcorrencias', 
            `<span class="percentage-up">${variacoes.ocorrencias}</span> vs período anterior`);
        
        this.atualizarElementoHTML('variacaoProcessos', 
            `<span class="percentage-down">${variacoes.processos}</span> vs período anterior`);
        
        this.atualizarElementoHTML('variacaoResolucao', 
            `<span class="percentage-up">${variacoes.resolucao}</span> vs período anterior`);
        
        this.atualizarElementoHTML('variacaoAlunos', 
            `<span class="percentage-up">${variacoes.alunos}</span> vs período anterior`);
    }

    atualizarTabelaOcorrencias() {
        const ocorrencias = db.getOcorrencias();
        const alunos = db.getAlunos();
        const periodo = this.chartManager.getPeriodoFiltro();
        const ocorrenciasFiltradas = this.chartManager.filtrarPorPeriodo(ocorrencias, periodo)
            .sort((a, b) => new Date(b.dataRegistro) - new Date(a.dataRegistro))
            .slice(0, 10); // Últimas 10
        
        const tbody = document.getElementById('tabelaOcorrenciasRecentes');
        if (!tbody) return;
        
        if (ocorrenciasFiltradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        Nenhuma ocorrência encontrada no período selecionado
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ocorrenciasFiltradas.map(ocorrencia => {
            const aluno = alunos.find(a => a.id === ocorrencia.alunoId);
            const gravidadeClass = {
                'leve': 'warning',
                'grave': 'danger',
                'gravissima': 'info'
            }[ocorrencia.tipo];
            
            return `
                <tr>
                    <td>${new Date(ocorrencia.dataRegistro).toLocaleDateString()}</td>
                    <td>${aluno ? aluno.nome : 'N/A'}</td>
                    <td>${ocorrencia.tipo}</td>
                    <td><span class="badge bg-${gravidadeClass}">${ocorrencia.tipo}</span></td>
                    <td>${ocorrencia.descricao.substring(0, 50)}${ocorrencia.descricao.length > 50 ? '...' : ''}</td>
                    <td><span class="badge bg-success">Registrada</span></td>
                </tr>
            `;
        }).join('');
    }

    mostrarLoading() {
        const graficos = document.querySelectorAll('canvas');
        graficos.forEach(canvas => {
            canvas.style.opacity = '0.5';
        });
    }

    esconderLoading() {
        const graficos = document.querySelectorAll('canvas');
        graficos.forEach(canvas => {
            canvas.style.opacity = '1';
        });
    }

    exportarRelatorios() {
        const periodo = this.chartManager.getPeriodoFiltro();
        const tipoRelatorio = document.getElementById('filtroTipoRelatorio');
        const tipo = tipoRelatorio ? tipoRelatorio.value : 'geral';
        
        const dados = {
            periodo: {
                inicio: periodo.inicio.toLocaleDateString('pt-BR'),
                fim: periodo.fim.toLocaleDateString('pt-BR')
            },
            tipo: tipo,
            dataExportacao: new Date().toLocaleString('pt-BR'),
            relatorio: this.gerarDadosExportacao()
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_saa_${new Date().getTime()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.mostrarMensagem('Relatório exportado com sucesso!', 'success');
    }

    gerarDadosExportacao() {
        return {
            resumo: this.gerarResumo(),
            ocorrencias: db.getOcorrencias(),
            processos: db.getProcessos(),
            alunos: db.getAlunos(),
            metricas: this.gerarMetricas(),
            estatisticas: db.getEstatisticas()
        };
    }

    gerarResumo() {
        const ocorrencias = db.getOcorrencias();
        const processos = db.getProcessos();
        const periodo = this.chartManager.getPeriodoFiltro();
        
        const ocorrenciasPeriodo = this.chartManager.filtrarPorPeriodo(ocorrencias, periodo);
        const processosPeriodo = this.chartManager.filtrarPorPeriodo(processos, periodo, 'dataAbertura');
        
        return {
            totalOcorrencias: ocorrencias.length,
            ocorrenciasPeriodo: ocorrenciasPeriodo.length,
            processosAtivos: processos.filter(p => p.status === 'aberto' || p.status === 'em_andamento').length,
            processosPeriodo: processosPeriodo.length,
            taxaResolucao: Math.round((processos.filter(p => p.status === 'concluido').length / processos.length) * 100) || 0
        };
    }

    gerarMetricas() {
        return {
            distribuicaoGravidade: this.chartManager.getDadosDistribuicaoGravidade(),
            topAlunos: this.chartManager.getDadosTopAlunos(),
            statusProcessos: this.chartManager.getDadosStatusProcessos(),
            evolucaoOcorrencias: this.chartManager.getDadosEvolucaoOcorrencias()
        };
    }

    imprimirRelatorios() {
        window.print();
    }

    // Utilitários
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

    mostrarMensagem(mensagem, tipo = 'info') {
        // Implementar toast notification
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

    // Relatórios específicos
    gerarRelatorioOcorrencias() {
        const ocorrencias = db.getOcorrencias();
        const alunos = db.getAlunos();
        const periodo = this.chartManager.getPeriodoFiltro();
        const ocorrenciasFiltradas = this.chartManager.filtrarPorPeriodo(ocorrencias, periodo);

        return {
            total: ocorrenciasFiltradas.length,
            porTipo: {
                leve: ocorrenciasFiltradas.filter(o => o.tipo === 'leve').length,
                grave: ocorrenciasFiltradas.filter(o => o.tipo === 'grave').length,
                gravissima: ocorrenciasFiltradas.filter(o => o.tipo === 'gravissima').length
            },
            detalhes: ocorrenciasFiltradas.map(ocorrencia => {
                const aluno = alunos.find(a => a.id === ocorrencia.alunoId);
                return {
                    data: new Date(ocorrencia.dataRegistro).toLocaleDateString(),
                    aluno: aluno ? aluno.nome : 'N/A',
                    tipo: ocorrencia.tipo,
                    descricao: ocorrencia.descricao,
                    artigo: ocorrencia.artigo
                };
            })
        };
    }

    gerarRelatorioProcessos() {
        const processos = db.getProcessos();
        const alunos = db.getAlunos();
        const periodo = this.chartManager.getPeriodoFiltro();
        const processosFiltrados = this.chartManager.filtrarPorPeriodo(processos, periodo, 'dataAbertura');

        return {
            total: processosFiltrados.length,
            porStatus: {
                aberto: processosFiltrados.filter(p => p.status === 'aberto').length,
                em_andamento: processosFiltrados.filter(p => p.status === 'em_andamento').length,
                concluido: processosFiltrados.filter(p => p.status === 'concluido').length,
                arquivado: processosFiltrados.filter(p => p.status === 'arquivado').length
            },
            detalhes: processosFiltrados.map(processo => {
                const aluno = alunos.find(a => a.id === processo.alunoId);
                return {
                    numero: processo.numero,
                    aluno: aluno ? aluno.nome : 'N/A',
                    dataAbertura: new Date(processo.dataAbertura).toLocaleDateString(),
                    status: processo.status,
                    gravidade: processo.tipoInfracao,
                    artigo: processo.artigo
                };
            })
        };
    }
}

// Funções globais
function carregarRelatorios() {
    if (typeof reportsManager !== 'undefined') {
        reportsManager.carregarRelatorios();
    }
}

function exportarRelatorios() {
    if (typeof reportsManager !== 'undefined') {
        reportsManager.exportarRelatorios();
    }
}

function imprimirRelatorios() {
    if (typeof reportsManager !== 'undefined') {
        reportsManager.imprimirRelatorios();
    }
}

// Inicializar gerenciador de relatórios
const reportsManager = new ReportsManager();