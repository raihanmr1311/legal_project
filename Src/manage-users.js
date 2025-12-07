document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        alert('Akses ditolak. Halaman ini hanya untuk admin.');
        window.location.href = 'main.html';
        return;
    }
    loadUsers();
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('perseroanId');
    localStorage.removeItem('perseroanName');
    window.location.href = 'login.html';
});

let currentEditId = null;

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const data = await response.json();
        
        if (data.success) {
            renderUsersTable(data.users);
        } else {
            alert('Gagal memuat data user: ' + (data.message || ''));
        }
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Gagal memuat data user');
    }
}

function renderUsersTable(users) {
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Tidak ada data user</td></tr>';
        return;
    }
    
    users.forEach((user, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td>${escapeHtml(user.username || '')}</td>
            <td>${escapeHtml(user.perseroan_name || user.perseroan || '-')}</td>
            <td><span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}">${user.role || 'user'}</span></td>
            <td>
                <button class="btn btn-sm btn-warning me-1" onclick="editUser(${user.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id}, '${escapeHtml(user.username)}')" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.getElementById('addUserBtn').addEventListener('click', function() {
    currentEditId = null;
    document.getElementById('userModalLabel').textContent = 'Tambah User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('password').required = true;
    document.getElementById('passwordGroup').querySelector('small').style.display = 'none';
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
});

window.editUser = async function(id) {
    try {
        const response = await fetch('/api/users/' + id);
        const data = await response.json();
        
        if (data.success && data.user) {
            currentEditId = id;
            document.getElementById('userModalLabel').textContent = 'Edit User';
            document.getElementById('userId').value = data.user.id;
            document.getElementById('username').value = data.user.username || '';
            document.getElementById('password').value = '';
            document.getElementById('password').required = false;
            document.getElementById('passwordGroup').querySelector('small').style.display = 'block';
            
            const perseroanSelect = document.getElementById('perseroan');
            if (data.user.perseroan) {
                const perseroanId = String(data.user.perseroan).match(/^\d+$/) ? data.user.perseroan : '';
                if (perseroanId) {
                    perseroanSelect.value = perseroanId;
                } else {
                    for (let opt of perseroanSelect.options) {
                        if (opt.text === data.user.perseroan) {
                            opt.selected = true;
                            break;
                        }
                    }
                }
            }
            
            document.getElementById('role').value = data.user.role || 'user';
            
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        } else {
            alert('Gagal memuat data user: ' + (data.message || ''));
        }
    } catch (error) {
        console.error('Error loading user:', error);
        alert('Gagal memuat data user');
    }
}

document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const selectedPers = document.getElementById('perseroan').value;
    const formData = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };
    // Only include perseroan when a non-empty value is selected to avoid overwriting with empty string
    if (typeof selectedPers !== 'undefined' && selectedPers !== null && String(selectedPers).trim() !== '') {
        formData.perseroan = selectedPers;
    }
    
    try {
        let response;
        if (currentEditId) {
            response = await fetch('/api/users/' + currentEditId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('userModal'));
            modal.hide();
            loadUsers();
            
            try {
                localStorage.setItem('flashMessage', currentEditId ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
            } catch (e) {}
            
            showFlashMessage(currentEditId ? 'User berhasil diupdate' : 'User berhasil ditambahkan');
        } else {
            alert('Gagal menyimpan user: ' + (data.message || ''));
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Gagal menyimpan user');
    }
});

let deleteUserId = null;

window.deleteUser = function(id, username) {
    deleteUserId = id;
    document.getElementById('deleteUsername').textContent = username;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
    if (!deleteUserId) return;
    
    try {
        const response = await fetch('/api/users/' + deleteUserId, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
            modal.hide();
            loadUsers();
            showFlashMessage('User berhasil dihapus');
        } else {
            alert('Gagal menghapus user: ' + (data.message || ''));
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus user');
    }
    
    deleteUserId = null;
});

function showFlashMessage(msg) {
    const container = document.querySelector('.content-card');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert">' +
        msg +
        '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
        '</div>';
    container.prepend(wrapper);
    
    setTimeout(() => {
        const alert = wrapper.querySelector('.alert');
        if (alert) {
            const bsAlert = bootstrap.Alert.getInstance(alert) || new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}
