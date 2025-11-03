// Gerenciar dropdown de notificações na navbar
class NotificationsDropdown {
    constructor() {
        this.init();
    }

    init() {
        // Atualizar dropdown quando abrir
        document.getElementById('navbarDropdown').addEventListener('show.bs.dropdown', () => {
            this.atualizarDropdown();
        });
    }

    atualizarDropdown() {
        const container = document.getElementById('dropdownNotificacoes');
        const notificacoes = notificationSystem.getNotificacoes({ status: 'nao_lida' }).slice(0, 5);
        
        if (notificacoes.length === 0) {
            container.innerHTML = `
                <li>
                    <a class="dropdown-item text-center text-muted">
                        <i class="fas fa-check-circle me-2"></i>
                        Nenhuma notificação não lida
                    </a>
                </li>
            `;
            return;
        }

        container.innerHTML = notificacoes.map(notificacao => `
            <li>
                <a class="dropdown-item" href="#" onclick="notificationSystem.verDetalhesNotificacao('${notificacao.id}')">
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${notificacao.titulo}</h6>
                        <small>${notificationSystem.calcularTempoDecorrido(notificacao.data)}</small>
                    </div>
                    <p class="mb-1">${notificacao.mensagem.substring(0, 50)}${notificacao.mensagem.length > 50 ? '...' : ''}</p>
                    <small class="text-${notificationSystem.getCorPrioridade(notificacao.prioridade)}">
                        <i class="fas fa-circle me-1"></i>${notificacao.prioridade}
                    </small>
                </a>
            </li>
        `).join('');
    }
}

// Inicializar dropdown
const notificationsDropdown = new NotificationsDropdown();