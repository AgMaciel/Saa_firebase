//API de Dados
Operações Básicas
Listar Registros
javascript
// Listar todos os alunos
const alunos = db.getAlunos();

// Listar com filtros
const processos = db.getProcessos().filter(p => p.status === 'ativo');
Criar Registro
javascript
// Criar novo aluno
const novoAluno = db.salvarAluno({
    nome: "João Silva",
    matricula: "20240001",
    curso: "Informática",
    nascimento: "2000-01-01"
});
Atualizar Registro
javascript
// Atualizar aluno
const alunoAtualizado = db.atualizarAluno(alunoId, {
    nome: "João Silva Santos",
    status: "inativo"
});
Excluir Registro
javascript
// Excluir aluno
const alunoExcluido = db.excluirAluno(alunoId);
🔐 API de Autenticação
Verificar Autenticação
javascript
// Verificar se usuário está logado
if (auth.getUserInfo()) {
    // Usuário autenticado
} else {
    // Redirecionar para login
}
Verificar Permissões
javascript
// Verificar permissão específica
if (auth.hasPermission('alunos.criar')) {
    // Usuário pode criar alunos
}

// Verificar múltiplas permissões
const podeGerenciar = auth.hasPermission('alunos.*') || 
                     auth.hasPermission('processos.*');