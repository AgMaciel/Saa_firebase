/**
 * SAA - Sistema de Gestão Discente
 * Gerenciamento de Gráficos e Visualizações
 * Versão: 1.0.0
 */

class ChartManager {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#0d6efd',
            secondary: '#6c757d',
            success: '#198754',
            danger: '#dc3545',
            warning: '#ffc107',
            info: '#0dcaf0',
            light: '#f8f9fa',
            dark: '#212529'
        };
        
        this.init();
    }

    init() {
        console.log('📊 Chart Manager inicializado');
    }

    initCharts() {
        this.initEvolucaoOcorrencias();
        this.initDistribuicaoGravidade();
        this.initTopAlunos();
        this.initStatusProcessos();
    }

    initEvolucaoOcorrencias() {
        const ctx = document.getElementById('graficoEvolucaoOcorrencias');
        if (!ctx) return;
        
        if (this.charts.has('evolucao')) {
            this.charts.get('evolucao').destroy();
        }

        const data = this.getDadosEvolucaoOcorrencias();
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.meses,
                datasets: [
                    {
                        label: 'Ocorrências Leves',
                        data: data.leves,
                        borderColor: this.colors.warning,
                        backgroundColor: this.hexToRgba(this.colors.warning, 0.1),
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Ocorrências Graves',
                        data: data.graves,
                        borderColor: this.colors.danger,
                        backgroundColor: this.hexToRgba(this.colors.danger, 0.1),
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    },
                    {
                        label: 'Ocorrências Gravissimas',
                        data: data.gravissimas,
                        borderColor: this.colors.info,
                        backgroundColor: this.hexToRgba(this.colors.info, 0.1),
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.colors.primary,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade de Ocorrências',
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Meses',
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });

        this.charts.set('evolucao', chart);
    }

    initDistribuicaoGravidade() {
        const ctx = document.getElementById('graficoDistribuicaoGravidade');
        if (!ctx) return;
        
        if (this.charts.has('distribuicao')) {
            this.charts.get('distribuicao').destroy();
        }

        const data = this.getDadosDistribuicaoGravidade();
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Leves', 'Graves', 'Gravíssimas'],
                datasets: [{
                    data: [data.leves, data.graves, data.gravissimas],
                    backgroundColor: [
                        this.colors.warning,
                        this.colors.danger,
                        this.colors.info
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%',
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

        this.charts.set('distribuicao', chart);
    }

    initTopAlunos() {
        const ctx = document.getElementById('graficoTopAlunos');
        if (!ctx) return;
        
        if (this.charts.has('topAlunos')) {
            this.charts.get('topAlunos').destroy();
        }

        const data = this.getDadosTopAlunos();
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.alunos,
                datasets: [{
                    label: 'Total de Ocorrências',
                    data: data.ocorrencias,
                    backgroundColor: [
                        this.hexToRgba(this.colors.primary, 0.8),
                        this.hexToRgba(this.colors.info, 0.8),
                        this.hexToRgba(this.colors.success, 0.8),
                        this.hexToRgba(this.colors.warning, 0.8),
                        this.hexToRgba(this.colors.danger, 0.8),
                        this.hexToRgba(this.colors.secondary, 0.8)
                    ],
                    borderColor: [
                        this.colors.primary,
                        this.colors.info,
                        this.colors.success,
                        this.colors.warning,
                        this.colors.danger,
                        this.colors.secondary
                    ],
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Quantidade de Ocorrências',
                            color: '#666'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });

        this.charts.set('topAlunos', chart);
    }

    initStatusProcessos() {
        const ctx = document.getElementById('graficoStatusProcessos');
        if (!ctx) return;
        
        if (this.charts.has('statusProcessos')) {
            this.charts.get('statusProcessos').destroy();
        }

        const data = this.getDadosStatusProcessos();
        
        const chart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Abertos', 'Em Andamento', 'Concluídos', 'Arquivados'],
                datasets: [{
                    data: [data.abertos, data.emAndamento, data.concluidos, data.arquivados],
                    backgroundColor: [
                        this.colors.success,
                        this.colors.warning,
                        this.colors.primary,
                        this.colors.secondary
                    ],
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });

        this.charts.set('statusProcessos', chart);
    }

    // Métodos para obter dados
    getDadosEvolucaoOcorrencias() {
        const ocorrencias = db.getOcorrencias();
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
        
        const meses = [];
        const leves = [];
        const graves = [];
        const gravissimas = [];
        
        // Gerar últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const data = new Date();
            data.setMonth(data.getMonth() - i);
            const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            meses.push(mes);
            
            const mesInicio = new Date(data.getFullYear(), data.getMonth(), 1);
            const mesFim = new Date(data.getFullYear(), data.getMonth() + 1, 0);
            
            const ocorrenciasMes = ocorrencias.filter(o => {
                const dataOcorrencia = new Date(o.dataRegistro);
                return dataOcorrencia >= mesInicio && dataOcorrencia <= mesFim;
            });
            
            leves.push(ocorrenciasMes.filter(o => o.tipo === 'leve').length);
            graves.push(ocorrenciasMes.filter(o => o.tipo === 'grave').length);
            gravissimas.push(ocorrenciasMes.filter(o => o.tipo === 'gravissima').length);
        }
        
        return { meses, leves, graves, gravissimas };
    }

    getDadosDistribuicaoGravidade() {
        const ocorrencias = db.getOcorrencias();
        const periodo = this.getPeriodoFiltro();
        const ocorrenciasFiltradas = this.filtrarPorPeriodo(ocorrencias, periodo);
        
        return {
            leves: ocorrenciasFiltradas.filter(o => o.tipo === 'leve').length,
            graves: ocorrenciasFiltradas.filter(o => o.tipo === 'grave').length,
            gravissimas: ocorrenciasFiltradas.filter(o => o.tipo === 'gravissima').length
        };
    }

    getDadosTopAlunos() {
        const ocorrencias = db.getOcorrencias();
        const alunos = db.getAlunos();
        const periodo = this.getPeriodoFiltro();
        const ocorrenciasFiltradas = this.filtrarPorPeriodo(ocorrencias, periodo);
        
        // Contar ocorrências por aluno
        const contadorAlunos = {};
        ocorrenciasFiltradas.forEach(ocorrencia => {
            if (!contadorAlunos[ocorrencia.alunoId]) {
                contadorAlunos[ocorrencia.alunoId] = 0;
            }
            contadorAlunos[ocorrencia.alunoId]++;
        });
        
        // Ordenar e pegar top 10
        const topAlunos = Object.entries(contadorAlunos)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([alunoId, count]) => {
                const aluno = alunos.find(a => a.id === alunoId);
                return {
                    nome: aluno ? this.abreviarNome(aluno.nome) : 'N/A',
                    count: count
                };
            });
        
        return {
            alunos: topAlunos.map(a => a.nome),
            ocorrencias: topAlunos.map(a => a.count)
        };
    }

    getDadosStatusProcessos() {
        const processos = db.getProcessos();
        const periodo = this.getPeriodoFiltro();
        const processosFiltrados = this.filtrarPorPeriodo(processos, periodo, 'dataAbertura');
        
        return {
            abertos: processosFiltrados.filter(p => p.status === 'aberto').length,
            emAndamento: processosFiltrados.filter(p => p.status === 'em_andamento').length,
            concluidos: processosFiltrados.filter(p => p.status === 'concluido').length,
            arquivados: processosFiltrados.filter(p => p.status === 'arquivado').length
        };
    }

    // Utilitários
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    getPeriodoFiltro() {
        const periodoSelect = document.getElementById('filtroPeriodo');
        const dataInicio = document.getElementById('filtroDataInicioRel');
        const dataFim = document.getElementById('filtroDataFimRel');
        
        if (!periodoSelect || !dataInicio || !dataFim) {
            // Valores padrão
            const fim = new Date();
            const inicio = new Date();
            inicio.setDate(inicio.getDate() - 30);
            return { inicio, fim };
        }

        if (periodoSelect.value === 'custom' && dataInicio.value && dataFim.value) {
            return {
                inicio: new Date(dataInicio.value),
                fim: new Date(dataFim.value)
            };
        } else {
            const dias = parseInt(periodoSelect.value) || 30;
            const fim = new Date();
            const inicio = new Date();
            inicio.setDate(inicio.getDate() - dias);
            return { inicio, fim };
        }
    }

    filtrarPorPeriodo(dados, periodo, campoData = 'dataRegistro') {
        return dados.filter(item => {
            const dataItem = new Date(item[campoData]);
            return dataItem >= periodo.inicio && dataItem <= periodo.fim;
        });
    }

    abreviarNome(nomeCompleto) {
        const partes = nomeCompleto.split(' ');
        if (partes.length <= 2) return nomeCompleto;
        
        const primeiroNome = partes[0];
        const ultimoNome = partes[partes.length - 1];
        return `${primeiroNome} ${ultimoNome}`;
    }

    atualizarTodosGraficos() {
        this.initCharts();
    }

    destroyAllCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    // Exportar gráficos como imagem
    exportarGrafico(nomeGrafico, formato = 'png') {
        const chart = this.charts.get(nomeGrafico);
        if (chart) {
            const link = document.createElement('a');
            link.download = `grafico_${nomeGrafico}.${formato}`;
            link.href = chart.toBase64Image();
            link.click();
        }
    }

    // Atualizar dados em tempo real
    atualizarDadosGraficos() {
        this.atualizarTodosGraficos();
    }
}

// Inicializar gerenciador de gráficos
const chartManager = new ChartManager();