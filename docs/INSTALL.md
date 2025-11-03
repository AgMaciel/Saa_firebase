#  Guia de Instalação - SAA Sistema

##  Visão Geral

Este guia irá ajudá-lo a instalar e configurar o **SAA - Sistema de Gestão Discente** em seu ambiente.

##  Requisitos do Sistema

### Requisitos Mínimos
- **Navegador Web**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript**: Habilitado no navegador
- **Armazenamento**: LocalStorage habilitado
- **Memória**: 512MB RAM
- **Tela**: 1024x768 pixels (mínimo)

### Requisitos Recomendados
- **Navegador**: Chrome 100+ ou Firefox 100+
- **Memória**: 1GB RAM
- **Tela**: 1366x768 pixels ou superior
- **Conexão**: Internet para CDNs (Bootstrap, Font Awesome, Chart.js)

##  Instalação Rápida

### Método 1: Servidor Web Local
1. **Download** do projeto completo
2. **Extraia** os arquivos em uma pasta do servidor web (Apache, Nginx, IIS)
3. **Acesse** `http://localhost/saa-sistema/index.html`
4. **Pronto!** O sistema está funcionando

### Método 2: Acesso Direto
1. **Download** do projeto completo
2. **Abra** o arquivo `index.html` diretamente no navegador
3. **Aceite** se houver alertas sobre execução local
4. **Pronto!** O sistema está funcionando

### Método 3: Hospedagem Web
1. **Faça upload** de todos os arquivos para seu servidor web
2. **Certifique-se** que a estrutura de pastas seja mantida
3. **Acesse** `https://seudominio.com/saa-sistema/index.html`
4. **Pronto!** O sistema está funcionando

## ⚙️ Configuração Inicial

### Primeiro Acesso
1. Acesse o sistema pela primeira vez
2. Use as credenciais padrão:
   - **Administrador**: `admin` / `admin123`
   - **Coordenador**: `coordenador` / `coord123`
   - **Professor**: `professor` / `prof123`
   - **Secretaria**: `secretaria` / `sec123`

### Configurações Recomendadas
1. **Altere as senhas padrão** após o primeiro login
2. **Configure o backup automático** em Configurações > Backup
3. **Ajuste as permissões** conforme necessidade da instituição
4. **Personalize os dados** dos usuários existentes

## 🔧 Configuração Avançada

### Personalização de Cores
Edite o arquivo `css/style.css`:

```css
:root {
    --primary-color: #0d6efd;    /* Cor primária */
    --secondary-color: #6c757d;  /* Cor secundária */
    --success-color: #198754;    /* Cor de sucesso */
    --danger-color: #dc3545;     /* Cor de perigo */
    /* ... outras cores */
}