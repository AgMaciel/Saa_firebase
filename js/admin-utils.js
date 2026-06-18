/* Admin Utilities
   - renewAdminPasswords(): sends password reset emails to admin accounts found in local DB
   - setAdminForceChange(): marks admin users with forcePasswordChange=true locally and in Firestore (if available)
   Usage: open the app in browser console and call `adminUtils.renewAdminPasswords()`
*/

window.adminUtils = (function () {
    async function renewAdminPasswords() {
        if (typeof db === 'undefined' || !db.getUsers) {
            console.error('Database not available (db.getUsers)');
            return;
        }

        const users = db.getUsers();
        const admins = users.filter(u => (u.tipo && u.tipo === 'admin') || (u.email && u.email.toLowerCase() === 'admin@escola.com'));

        if (!admins || admins.length === 0) {
            console.warn('No admin users found to renew passwords for.');
            return;
        }

        for (const user of admins) {
            if (!user.email) continue;
            try {
                await firebase.auth().sendPasswordResetEmail(user.email);
                console.log(`✉️ Reset email enviado para: ${user.email}`);
            } catch (e) {
                console.error(`❌ Falha ao enviar reset para ${user.email}:`, e.message || e);
            }

            // Mark forcePasswordChange locally and in Firestore
            try {
                db.updateUser(user.id, { forcePasswordChange: true });
                if (db.useFirestore && db.db) {
                    await db.db.collection('users').doc(user.id.toString()).set({ forcePasswordChange: true }, { merge: true });
                }
                console.log(`🔒 Marcado forcePasswordChange para ${user.email}`);
            } catch (e) {
                console.warn('Não foi possível atualizar flag forcePasswordChange:', e.message || e);
            }
        }

        alert('Tentativa de renovação de senha iniciada para administradores. Verifique o console para detalhes.');
    }

    function setAdminForceChange() {
        if (typeof db === 'undefined' || !db.getUsers) {
            console.error('Database not available (db.getUsers)');
            return;
        }
        const users = db.getUsers();
        const admins = users.filter(u => (u.tipo && u.tipo === 'admin') || (u.email && u.email.toLowerCase() === 'admin@escola.com'));
        admins.forEach(u => {
            db.updateUser(u.id, { forcePasswordChange: true });
            if (db.useFirestore && db.db) {
                db.db.collection('users').doc(u.id.toString()).set({ forcePasswordChange: true }, { merge: true });
            }
            console.log(`🔒 Flag aplicada para ${u.email}`);
        });
        alert('Flags de troca de senha aplicadas aos administradores localmente (e na nuvem se configurada).');
    }

    return {
        renewAdminPasswords,
        setAdminForceChange
        /**
         * Gera senhas temporárias para administradores (APENAS PARA DEV/local).
         * - Atualiza `saa_users` com o campo `devTempPassword` e `forcePasswordChange: true`.
         * - Cria backup em localStorage como `saa_users_backup_<timestamp>`.
         * - Retorna um objeto { email: password } e cria um download automático (JSON).
         * Usage: adminUtils.generateDevTempPasswords({length:12, backup:true, download:true})
         */
        generateDevTempPasswords: async function (opts = {}) {
            const { length = 12, backup = true, download = true } = opts;
            if (typeof db === 'undefined' || !db.getUsers) {
                console.error('Database not available (db.getUsers)');
                return null;
            }

            const users = db.getUsers();
            const admins = users.filter(u => (u.tipo && u.tipo === 'admin') || (u.email && u.email.toLowerCase() === 'admin@escola.com'));
            if (!admins || admins.length === 0) {
                console.warn('Nenhum administrador encontrado para gerar senhas temporárias.');
                return null;
            }

            // backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            if (backup) {
                try {
                    localStorage.setItem(`saa_users_backup_${timestamp}`, JSON.stringify(users));
                    console.log(`📦 Backup criado: saa_users_backup_${timestamp}`);
                } catch (e) {
                    console.warn('Falha ao criar backup local:', e.message || e);
                }
            }

            function makePassword(len) {
                const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const lower = 'abcdefghijklmnopqrstuvwxyz';
                const digits = '0123456789';
                const specials = '!@#$%&*()-_=+[]{}<>?';
                const all = upper + lower + digits + specials;
                // ensure complexity
                let pw = '';
                pw += upper[Math.floor(Math.random() * upper.length)];
                pw += lower[Math.floor(Math.random() * lower.length)];
                pw += digits[Math.floor(Math.random() * digits.length)];
                pw += specials[Math.floor(Math.random() * specials.length)];
                for (let i = pw.length; i < len; i++) {
                    pw += all[Math.floor(Math.random() * all.length)];
                }
                // shuffle
                pw = pw.split('').sort(() => 0.5 - Math.random()).join('');
                return pw;
            }

            const result = {};
            admins.forEach(admin => {
                const pwd = makePassword(length);
                result[admin.email] = pwd;
                // update local user object
                try {
                    admin.devTempPassword = pwd;
                    admin.forcePasswordChange = true;
                    db.updateUser(admin.id, admin);
                } catch (e) {
                    console.warn('Erro ao atualizar usuário local:', admin.email, e.message || e);
                }
            });

            // Save updated users array to localStorage (db.updateUser already did per-user, but ensure array persists)
            try {
                localStorage.setItem('saa_users', JSON.stringify(db.getUsers()));
            } catch (e) {
                console.warn('Falha ao salvar saa_users:', e.message || e);
            }

            console.log('🔐 Senhas temporárias geradas para administradores:', result);

            if (download) {
                try {
                    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `admin_temp_passwords_${timestamp}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    console.log('📥 Arquivo com senhas temporárias baixado automaticamente.');
                } catch (e) {
                    console.warn('Falha ao criar download automático:', e.message || e);
                }
            }

            return result;
        }
    };
})();

console.log('adminUtils carregado. Use adminUtils.renewAdminPasswords() no console para enviar e-mails de reset.');
