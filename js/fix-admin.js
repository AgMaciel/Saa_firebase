/**
 * Emergency Admin Fix Script
 * Run: window.fixAdminUser() in browser console
 */
window.fixAdminUser = function () {
    console.log('🔧 FIXING ADMIN USER...');

    if (!localStorage) {
        console.error('❌ LocalStorage not available');
        return;
    }

    // Get current users
    const usersJson = localStorage.getItem('saa_users');
    if (!usersJson) {
        console.error('❌ No users found in localStorage');
        return;
    }

    let users = JSON.parse(usersJson);
    console.log(`📊 Found ${users.length} users`);

    // Find admin by email (case insensitive)
    const adminIndex = users.findIndex(u => u.email && u.email.toLowerCase() === 'admin@escola.com');

    if (adminIndex === -1) {
        console.warn('⚠️ Admin user not found. Creating new one...');
        users.push({
            id: 'admin_master',
            email: 'admin@escola.com',
            nome: 'Administrador Sistema',
            tipo: 'admin',
            cargos: ['admin'],
            permissoes: ['*'],
            ativo: true,
            authProvider: 'firebase'
        });
    } else {
        console.log(`✅ Found admin at index ${adminIndex}`);
        console.log('Before:', JSON.stringify(users[adminIndex], null, 2));

        // Force correct values
        users[adminIndex].tipo = 'admin';
        users[adminIndex].permissoes = ['*'];
        users[adminIndex].cargos = ['admin'];
        users[adminIndex].ativo = true;

        console.log('After:', JSON.stringify(users[adminIndex], null, 2));
    }

    // Save back
    localStorage.setItem('saa_users', JSON.stringify(users));
    console.log('💾 Saved to localStorage');

    // If Firestore is available, update there too
    if (window.db && window.db.useFirestore && window.db.db) {
        const adminUser = users.find(u => u.email.toLowerCase() === 'admin@escola.com');
        window.db.db.collection('users').doc(adminUser.id).set(adminUser, { merge: true })
            .then(() => console.log('☁️ Updated in Firestore'))
            .catch(e => console.error('Firestore update failed:', e));
    }

    console.log('✅ ADMIN FIX COMPLETE. Please refresh the page.');
    alert('Admin user fixed! Please refresh the page and log in again.');
};

console.log('💡 Admin fix script loaded. Run: window.fixAdminUser()');
