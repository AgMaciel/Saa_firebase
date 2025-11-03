# SAA - Sistema de Gestão Discente

## 📋 Sobre o Sistema

O **SAA - Sistema de Gestão Discente** é uma plataforma web completa para gerenciamento de alunos, ocorrências disciplinares, processos administrativos e relatórios institucionais.

## 🚀 Funcionalidades

### ✅ Módulos Principais
- **Gestão de Alunos** - Cadastro e acompanhamento de estudantes
- **Registro de Ocorrências** - Classificação por gravidade (leve, grave, gravíssima)
- **Processos Disciplinares** - Tramitação completa conforme regulamento
- **Relatórios e Estatísticas** - Gráficos interativos e exportação de dados
- **Sistema de Backup** - Backup automático e restauração
- **Notificações e Alertas** - Sistema de alertas em tempo real

### 🔐 Segurança
- Sistema de autenticação multi-nível
- Controle de permissões por tipo de usuário
- Backup automático dos dados
- Logs de acesso e atividades

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Framework**: Bootstrap 5.3.0
- **Gráficos**: Chart.js
- **Ícones**: Font Awesome 6.0.0
- **Armazenamento**: LocalStorage (com sistema de backup)

## 📦 Instalação

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web (Apache, Nginx) ou abrir diretamente no navegador

### Passos
1. Faça o download ou clone do projeto
2. Extraia os arquivos em um diretório web
3. Acesse `index.html` no navegador
4. Use as credenciais padrão para login

## 👥 Tipos de Usuários

### 🔧 Administrador
- **Usuário**: `admin`
- **Senha**: `admin123`
- **Acesso**: Completo a todos os módulos

### 🎓 Coordenador
- **Usuário**: `coordenador` 
- **Senha**: `coord123`
- **Acesso**: Gestão de alunos, ocorrências e processos

### 👨‍🏫 Professor
- **Usuário**: `professor`
- **Senha**: `prof123`
- **Acesso**: Registrar ocorrências e acompanhar processos

### 📋 Secretaria
- **Usuário**: `secretaria`
- **Senha**: `sec123`
- **Acesso**: Gestão de alunos e relatórios

## 📊 Estrutura de Dados

### Alunos
- Dados cadastrais completos
- Histórico de ocorrências
- Situação acadêmica

### Ocorrências
- Classificação por gravidade
- Vinculação a artigos do regulamento
- Registro de data e responsável

### Processos Disciplinares
- Numeração automática
- Timeline de andamentos
- Prazos e status
- Sanções aplicáveis

## 🔄 Sistema de Backup

### Backup Automático
- Configuração de frequência
- Retenção personalizada
- Exportação em JSON

### Restauração
- Restauração seletiva
- Upload de backups
- Validação de integridade

## 📈 Relatórios

### Estatísticas
- Evolução temporal de ocorrências
- Distribuição por gravidade
- Top alunos com mais ocorrências
- Status dos processos

### Exportação
- Formato JSON
- Dados completos ou filtrados
- Metadados de exportação

## 🐛 Solução de Problemas

### Problemas Comuns
1. **Dados não salvam** - Verificar se o LocalStorage está habilitado
2. **Gráficos não carregam** - Verificar conexão com internet para CDN
3. **Login não funciona** - Verificar credenciais no arquivo auth.js

### Suporte
Para suporte técnico, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Este sistema é desenvolvido para uso institucional.

## 🔄 Changelog

### Versão 1.0.0
- ✅ Sistema completo implementado
- ✅ Todos os módulos funcionais
- ✅ Interface responsiva
- ✅ Sistema de backup
- ✅ Relatórios com gráficos