SAA - Sistema de Gestão Discente (downgrade v1)

Este repositório contém a aplicação SAA. Pequenas instruções abaixo para habilitar sincronização de notificações via Firebase/Firestore e como publicar este projeto no Git.

Firebase (opcional)
- Para ativar a sincronização de notificações com Firebase/Firestore, adicione o SDK do Firebase no HTML (antes de `js/notifications.js`) e defina `window.firebaseConfig` com as credenciais do seu projeto.

Exemplo (CDN, coloque no <head> ou antes do script):

```html
<!-- Firebase App (namespaced SDK) -->
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>

<script>
  // Exemplo: substitua pelos valores do seu projeto
  window.firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT",
    // ... outros campos
  };
  // Opcional: inicializar aqui ou será inicializado automaticamente pelo código se a SDK estiver carregada
  // firebase.initializeApp(window.firebaseConfig);
</script>
```

Notas:
- A implementação no arquivo `js/notifications.js` faz uma sincronização "best-effort": mantém o armazenamento local (localStorage) como fonte de verdade para a aplicação e, se o Firebase/Firestore estiver disponível e configurado, escuta a coleção `notifications` e espelha alterações para o armazenamento local. Também tenta escrever alterações no Firestore quando notificações são criadas/atualizadas/excluídas.
- Garanta regras de segurança do Firestore apropriadas para o seu uso (autenticação e regras de leitura/escrita).

Publicar no Git
1) Inicializar repositório local e fazer commit inicial (eu irei rodar estes comandos localmente no seu workspace):

```powershell
cd "c:\Users\agism\saa_down_grade_v1"
git init
git add .
git commit -m "chore: initial import"
```

2) Para subir para um repositório remoto (GitHub/GitLab/Bitbucket), crie o repositório remoto e em seguida execute:

```powershell
# substituir <remote-url> pelo SSH ou HTTPS do repositório
git remote add origin <remote-url>
git branch -M main
git push -u origin main
```

Se preferir usar `master` em vez de `main`, ajuste `branch -M` apropriadamente.

Se quiser, eu posso também criar um `.github` workflow básico para CI ou ajudar a criar o repositório remoto (vai precisar de token/integração sua).

Contato
- Se quiser que eu finalize a configuração do Firebase (armazenamento de configurações do usuário no Firestore, autenticação, regras), diga qual fluxo de autenticação você usa (anon, email/senha, firebase auth custom) para eu adaptar o código.

Resetar usuários padrão (local)
--
Se precisar restaurar os usuários padrão no ambiente local (útil para desenvolvimento), abra o console do navegador na página de login (`F12`) e execute:

```js
// Recria os usuários padrão com senhas temporárias
auth.resetDefaultUsers();
```

Após executar, as credenciais temporárias padrão serão:
- admin.saa / Adm@SAA2025
- coord.saa / Coord@SAA2025
- prof.saa / Prof@SAA2025
- sec.saa / Sec@SAA2025

Observação: as senhas estão marcadas como temporárias e o sistema solicitará alteração no primeiro login.
