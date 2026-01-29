/**
 * Script de Restauração de Usuários Legado / Bootstrap
 * Execute window.restoreLegacyUsers() no console para criar usuários padrão.
 */
/**
 * Script de Restauração de Usuários Legado / Bootstrap
 * Execute window.resetToAdminOnly() no console para resetar.
 */
window.resetToAdminOnly = async function () {
    console.log('☢️ INICIANDO RESET TOTAL (Mantendo apenas Admin)...');

    if (!window.db || !window.db.getUsers) {
        console.error('❌ Erro: DB não inicializado.');
        return;
    }

    const currentUsers = window.db.getUsers();

    // Admin Master Object
    const adminUser = {
        email: 'admin@escola.com',
        nome: 'Administrador Sistema',
        tipo: 'admin',
        cargos: ['admin'],
        permissoes: ['*'],
        ativo: true,
        id: 'admin_master',
        authProvider: null
    };

    // 1. Limpar LocalStorage e definir Admin
    let newUsers = [];
    // Tenta encontrar um admin existente para preservar metadados se houver
    const existingAdmin = currentUsers.find(u => u.email === 'admin@escola.com');
    if (existingAdmin) {
        console.log('✅ Metadados de Admin preservados.');
        existingAdmin.tipo = 'admin';
        existingAdmin.permissoes = ['*'];
        existingAdmin.cargos = ['admin'];
        newUsers.push(existingAdmin);
    } else {
        newUsers.push(adminUser);
    }

    localStorage.setItem('saa_users', JSON.stringify(newUsers));
    console.log('✅ LocalStorage atualizado.');

    // 2. Limpar Firestore (Se estiver conectado)
    if (window.db.useFirestore && window.db.db) {
        console.log('🔥 Limpando Firestore...');
        try {
            const snapshot = await window.db.db.collection('users').get();
            const batch = window.db.db.batch();
            let count = 0;

            snapshot.docs.forEach(doc => {
                const userData = doc.data();
                if (userData.email !== 'admin@escola.com') {
                    batch.delete(doc.ref);
                    count++;
                } else {
                    // Forçar update do admin no cloud
                    const adminRef = window.db.db.collection('users').doc(doc.id);
                    batch.set(adminRef, existingAdmin || adminUser, { merge: true });
                }
            });

            // Se admin não estava no cloud, criar
            if (!snapshot.docs.find(d => d.data().email === 'admin@escola.com')) {
                const newRef = window.db.db.collection('users').doc(adminUser.id);
                batch.set(newRef, adminUser);
            }

            await batch.commit();
            console.log(`🗑️ ${count} usuários removidos do Firestore. Admin preservado/atualizado.`);
        } catch (e) {
            console.error('Erro ao limpar Firestore:', e);
            alert('Erro ao limpar nuvem. Verifique o console.');
        }
    }

    console.log('🏁 RESET CONCLUÍDO. Apenas Admin existe.');
    alert('Sistema resetado! Apenas o Admin permanece. A página será recarregada.');
    location.reload();
};

// Manter alias antigo para compatibilidade, mas redirecionando para o reset se for o desejo
window.restoreLegacyUsers = window.resetToAdminOnly;
