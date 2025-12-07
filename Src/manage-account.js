document.addEventListener('DOMContentLoaded', function(){
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
        // try to fetch via session? redirect to dashboard
        window.location.href = 'main.html';
        return;
    }

    const msg = document.getElementById('msg');
    const form = document.getElementById('accountForm');

    async function loadUser() {
        try {
            const res = await fetch('/api/user?id=' + encodeURIComponent(userId));
            const j = await res.json();
            if (j && j.success && j.user) {
                document.getElementById('userId').value = j.user.id;
                document.getElementById('username').value = j.user.username || '';
                // set perseroan display and hidden value so it's submitted back
                const rawPers = typeof j.user.perseroan !== 'undefined' ? j.user.perseroan : '';
                const persDisplay = document.getElementById('perseroanDisplay');
                const persHidden = document.getElementById('perseroanHidden');
                persHidden.value = rawPers || '';
                if (rawPers && String(rawPers).match(/^\d+$/)) {
                    // fetch perseroan name if we have an id
                    try {
                        const r2 = await fetch('/api/perseroan?id=' + encodeURIComponent(rawPers));
                        const j2 = await r2.json();
                        if (j2 && j2.success && j2.perseroan) {
                            persDisplay.value = j2.perseroan.perseroan || String(rawPers);
                        } else {
                            persDisplay.value = String(rawPers);
                        }
                    } catch (e) {
                        persDisplay.value = String(rawPers);
                    }
                } else {
                    persDisplay.value = rawPers || '';
                }
            } else {
                msg.innerHTML = '<div class="alert alert-warning">Gagal memuat data user</div>';
            }
        } catch (e) {
            console.error('loadUser error', e);
            msg.innerHTML = '<div class="alert alert-danger">Gagal memuat data user</div>';
        }
    }

    loadUser();

    form.addEventListener('submit', async function(e){
        e.preventDefault();
        msg.innerHTML = '';
        const id = document.getElementById('userId').value;
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (!username) { msg.innerHTML = '<div class="alert alert-danger">Username wajib diisi</div>'; return; }
        try {
            const body = { username };
            if (password && password.length > 0) body.password = password;
            const persVal = document.getElementById('perseroanHidden') && document.getElementById('perseroanHidden').value;
            if (typeof persVal !== 'undefined' && persVal !== null && String(persVal).trim() !== '') {
                body.perseroan = persVal;
            }
            const res = await fetch('/api/users/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const j = await res.json();
            if (j && j.success) {
                msg.innerHTML = '<div class="alert alert-success">Perubahan tersimpan</div>';
                try { localStorage.setItem('flashMessage','Perubahan profil tersimpan'); } catch(e){}
                setTimeout(()=>{ window.location.href = 'main.html'; }, 1000);
            } else {
                msg.innerHTML = '<div class="alert alert-danger">Gagal menyimpan: ' + (j.message || '') + '</div>';
            }
        } catch (e) {
            console.error('save error', e);
            msg.innerHTML = '<div class="alert alert-danger">Gagal menyimpan data</div>';
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', function(){
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        localStorage.removeItem('perseroanId');
        localStorage.removeItem('perseroanName');
        window.location.href = 'login.html';
    });
});