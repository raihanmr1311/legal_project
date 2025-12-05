document.addEventListener('DOMContentLoaded', function() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
});

// Show one-time flash message set by other pages (e.g. form-laporan.html)
document.addEventListener('DOMContentLoaded', function() {
    try {
        const msg = localStorage.getItem('flashMessage');
        if (msg) {
            const container = document.querySelector('.dashboard-card') || document.body;
            const wrapper = document.createElement('div');
            wrapper.innerHTML = '<div class="alert alert-success alert-dismissible fade show" role="alert">' +
                msg +
                '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' +
                '</div>';
            container.prepend(wrapper);
            localStorage.removeItem('flashMessage');
        }
    } catch (e) {
        try { localStorage.removeItem('flashMessage'); } catch (_) {}
    }
});

document.addEventListener('DOMContentLoaded', function() {
    var tambahBtn = document.getElementById('tambahLaporanBtn');
    if (tambahBtn) {
        
        tambahBtn.addEventListener('click', function() {
            window.location.href = 'form-laporan.html';
        });
    }
});
let laporanData = [];
let searchKeyword = '';
let currentPage = 1;
let perPage = 10;
let filteredData = [];

function highlight(text, keyword) {
    if (!keyword) return text;
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

function getUserRole() {
    return localStorage.getItem('userRole') || 'guest';
}

function isAdmin() {
    return getUserRole() === 'admin';
}

function getUserPerseroanId() {
    const v = localStorage.getItem('perseroanId');
    if (!v) return null;
    return String(v).match(/^\d+$/) ? Number(v) : v;
}

function isOwner(laporan) {
    const userPid = getUserPerseroanId();
    if (!userPid) return false;
    if (!laporan) return false;
    if (typeof laporan.perseroan_id !== 'undefined' && laporan.perseroan_id !== null) {
        return Number(laporan.perseroan_id) === Number(userPid);
    }
    if (String(laporan.perseroan).match(/^\d+$/)) {
        return Number(laporan.perseroan) === Number(userPid);
    }
    return false;
}

function renderTable(data) {
    const tbody = document.querySelector("#laporanTable tbody");
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted">Tidak ada data ditemukan</td></tr>';
        return;
    }
    data.forEach((laporan, idx) => {
        const tr = document.createElement("tr");
        const actions = [];
        actions.push('<button class="btn btn-sm btn-info me-1" title="Lihat Detail" onclick="detailLaporan(' + idx + ')"><i class="bi bi-eye"></i></button>');
        if (isAdmin() || isOwner(laporan)) {
            actions.push('<button class="btn btn-sm btn-primary me-1" title="Edit" onclick="editLaporan(' + idx + ')"><i class="bi bi-pencil"></i></button>');
        }
        if (isAdmin()) {
            actions.push('<button class="btn btn-sm btn-danger" title="Hapus" onclick="hapusLaporan(' + idx + ')"><i class="bi bi-trash"></i></button>');
        }

        tr.innerHTML =
            '<td>' + (idx + 1) + '</td>' +
            '<td>' + highlight(laporan['perseroan'] || laporan['perseroan_id'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['email'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Jenis Laporan'] || laporan['Nama Laporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Periode Laporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Tahun Laporan'] || laporan['Tahun Pelaporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Instansi Tujuan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(formatTanggal(laporan['Tanggal Dikirim'] || laporan['Tanggal Pelaporan'] || laporan['tanggal_pelaporan'] || laporan['tanggal_dikirim'] || ''), searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Status'] || laporan['status'] || '-', searchKeyword) + '</td>' +
            '<td>' + (laporan['Keterangan'] ? highlight(laporan['Keterangan'], searchKeyword) : '-') + '</td>' +
            '<td>' + (laporan['File'] ? ('<a href="' + laporan['File'] + '" target="_blank">' + stripHtml(laporan['File']) + '</a>') : '-') + '</td>' +
            '<td>' + actions.join('') + '</td>';
        tbody.appendChild(tr);
    });
}

    globalThis.detailLaporan = function(idx) {
    const laporan = filteredData[idx];
    if (!laporan) return;
    let html = '';
        html += '<div class="mb-2"><strong>Perseroan:</strong> ' + (laporan['perseroan'] || laporan['perseroan_id'] || '-') + '</div>';
        html += '<div class="mb-2"><strong>Jenis Laporan:</strong> ' + (laporan['Jenis Laporan'] || laporan['Nama Laporan'] || '-') + '</div>';
        html += '<div class="mb-2"><strong>Periode Laporan:</strong> ' + (laporan['Periode Laporan'] || '') + '</div>';
        html += '<div class="mb-2"><strong>Tahun Laporan:</strong> ' + (laporan['Tahun Laporan'] || laporan['Tahun Pelaporan'] || '-') + '</div>';
        html += '<div class="mb-2"><strong>Instansi Tujuan:</strong> ' + (laporan['Instansi Tujuan'] || '') + '</div>';
        const tanggalForDisplay = formatTanggal(laporan['Tanggal Dikirim'] || laporan['Tanggal Pelaporan'] || laporan['tanggal_pelaporan'] || laporan['tanggal_dikirim'] || '');
        html += '<div class="mb-2"><strong>Tanggal Dikirim:</strong> ' + (tanggalForDisplay || '-') + '</div>';
        html += '<div class="mb-2"><strong>Status:</strong> ' + (laporan['Status'] || laporan['status'] || '-') + '</div>';
        html += '<div class="mb-2"><strong>Keterangan:</strong> ' + (laporan['Keterangan'] || '-') + '</div>';
        html += '<div class="mb-2"><strong>File:</strong> ' + (laporan['File'] ? ('<a href="' + laporan['File'] + '" target="_blank">' + stripHtml(laporan['File']) + '</a>') : '-') + '</div>';
    document.getElementById('detailModalBody').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

globalThis.editLaporan = function(idx) {
    if (!isLoggedIn()) {
        showLoginModal(function() {
            editLaporan(idx);
        });
        return;
    }
    const laporan = filteredData[idx];
    if (!laporan) {
        alert('Data tidak ditemukan!');
        return;
    }
    if (!isAdmin() && !isOwner(laporan)) {
        alert('Aksi ini hanya untuk admin atau pemilik perseroan.');
        return;
    }
    let html = '';
    const readonlyPers = (!isAdmin());
    html += '<div class="mb-2"><label class="form-label">Perseroan</label>' +
            '<input type="text" class="form-control" name="perseroan" value="' + (laporan['perseroan'] || '') + '" ' + (readonlyPers ? 'readonly' : '') + ' required>' +
            (laporan.perseroan_id ? ('<input type="hidden" name="perseroan_id" value="' + laporan.perseroan_id + '">') : '') +
            '</div>';
    html += '<div class="mb-2"><label class="form-label">Jenis Laporan</label><input type="text" class="form-control" name="jenis_laporan" value="' + (laporan['Jenis Laporan'] || laporan['Nama Laporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Periode Laporan</label><input type="text" class="form-control" name="periode_laporan" value="' + (laporan['Periode Laporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Tahun Laporan</label><input type="text" class="form-control" name="tahun_laporan" value="' + (laporan['Tahun Laporan'] || laporan['Tahun Pelaporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Instansi Tujuan</label><input type="text" class="form-control" name="instansi_tujuan" value="' + (laporan['Instansi Tujuan'] || '') + '" required></div>';
    let tglValue = (laporan['Tanggal Dikirim'] || laporan['Tanggal Pelaporan'] || laporan['tanggal_pelaporan'] || laporan['tanggal_dikirim'] || '').slice(0,10);
    html += '<div class="mb-2"><label class="form-label">Tanggal Dikirim</label><input type="date" class="form-control" name="tanggal_dikirim" value="' + tglValue + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Keterangan</label><input type="text" class="form-control" name="keterangan" value="' + (laporan['Keterangan'] || '') + '"></div>';
        
        if (laporan['File']) {
                html += '<div class="mb-2"><label class="form-label">File</label><div><a href="' + laporan['File'] + '" target="_blank">' + stripHtml(laporan['File']) + '</a></div></div>';
        }
        
        const currentStatus = laporan['Status'] || laporan['status'] || '';
        html += '<div class="mb-2"><label class="form-label">Status</label>' +
                        '<select class="form-select" name="status">' +
                            '<option value="">-- Pilih Status --</option>' +
                            '<option value="dikirim"' + (currentStatus === 'dikirim' ? ' selected' : '') + '>Dikirim</option>' +
                            '<option value="pending"' + (currentStatus === 'pending' ? ' selected' : '') + '>Pending</option>' +
                            '<option value="draft"' + (currentStatus === 'draft' ? ' selected' : '') + '>Draft</option>' +
                        '</select></div>';
    document.getElementById('editModalBody').innerHTML = html;
    
    setTimeout(function() {
        const editForm = document.getElementById('editLaporanForm');
        if (!editForm) {
            alert('Form edit tidak ditemukan!');
            return;
        }
        const newForm = editForm.cloneNode(true);
        editForm.parentNode.replaceChild(newForm, editForm);
        const modal = new bootstrap.Modal(document.getElementById('editModal'));
        modal.show();
            newForm.onsubmit = function(e) {
            e.preventDefault();
            const form = e.target;
            const data = {
                perseroan: form.perseroan.value,
                jenis_laporan: form.jenis_laporan.value,
                periode_laporan: form.periode_laporan.value,
                tahun_laporan: form.tahun_laporan.value,
                instansi_tujuan: form.instansi_tujuan.value,
                tanggal_dikirim: form.tanggal_dikirim.value,
                keterangan: form.keterangan.value,
                file: form.file ? form.file.value : '',
                status: form.status ? form.status.value : ''
            };
            fetch('/api/laporan/' + laporan.id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(res => res.json())
            .then(res => {
                        if (res.success) {
                            Object.assign(laporan, {
                                perseroan: data.perseroan || laporan.perseroan,
                                'Jenis Laporan': data.jenis_laporan,
                                'Periode Laporan': data.periode_laporan,
                                'Tahun Laporan': data.tahun_laporan,
                                'Instansi Tujuan': data.instansi_tujuan,
                                'Tanggal Pelaporan': data.tanggal_dikirim,
                                'Tanggal Dikirim': data.tanggal_dikirim,
                                'Keterangan': data.keterangan,
                                'File': (typeof data.file !== 'undefined' && data.file !== '') ? data.file : (laporan['File'] || ''),
                                'Status': data.status || laporan['Status'] || laporan['status']
                            });
                    const idxInLaporanData = laporanData.findIndex(lap => lap.id === laporan.id);
                    if (idxInLaporanData !== -1) {
                        Object.assign(laporanData[idxInLaporanData], laporan);
                    }
                    modal.hide();
                    updateTableDisplay();
                } else {
                    alert('Gagal update data: ' + (res.message || ''));
                }
            })
            .catch(() => alert('Gagal update data'));
        };
    }, 0);
}

var hapusIdx = null;
globalThis.hapusLaporan = function(idx) {
    if (!isLoggedIn()) {
        showLoginModal(function() {
            hapusLaporan(idx);
        });
        return;
    }
    hapusIdx = idx;
    
    const laporan = filteredData[idx];
    let html = 'Apakah Anda yakin ingin menghapus data ini?';
    if (!isAdmin()) {
        alert('Aksi ini hanya untuk admin.');
        return;
    }
    if (laporan) {
        html += '<hr class="my-2">';
        html += '<div><strong>Nama Laporan:</strong> ' + (laporan['Nama Laporan'] || '-') + '</div>';
        html += '<div><strong>Perseroan:</strong> ' + (laporan['perseroan'] || '-') + '</div>';
        html += '<div><strong>Periode:</strong> ' + (laporan['Periode Laporan'] || '-') + '</div>';
        html += '<div><strong>Tahun:</strong> ' + (laporan['Tahun Pelaporan'] || '-') + '</div>';
    }
    document.getElementById('hapusModalBody').innerHTML = html;
    const modal = new bootstrap.Modal(document.getElementById('hapusModal'));
    modal.show();
}

document.addEventListener('DOMContentLoaded', function() {
    const hapusBtn = document.getElementById('hapusModalConfirmBtn');
    if (hapusBtn) {
        hapusBtn.onclick = function() {
            if (hapusIdx !== null) {
                const laporan = filteredData[hapusIdx];
                if (!laporan) return;
                fetch('/api/laporan/' + laporan.id, {
                    method: 'DELETE'
                })
                .then(res => res.json())
                .then(res => {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('hapusModal'));
                    modal.hide();
                    if (res.success) {
                        return fetch('/api/laporan').then(r => r.json()).then(d => {
                            laporanData = d.map(lap => ({
                                ...lap,
                                'Nama Laporan': lap.nama_laporan,
                                'Periode Laporan': lap.periode_laporan,
                                'Tahun Pelaporan': lap.tahun_pelaporan,
                                'Instansi Tujuan': lap.instansi_tujuan,
                                'Tanggal Pelaporan': lap.tanggal_pelaporan,
                                'Keterangan': lap.keterangan
                            }));
                            filteredData = laporanData;
                            updateTableDisplay();
                        });
                    } else {
                        alert('Gagal hapus data: ' + (res.message || ''));
                    }
                    hapusIdx = null;
                })
                .catch(() => {
                    alert('Gagal hapus data');
                    hapusIdx = null;
                });
            }
        };
    }
});
    
function formatTanggal(tgl) {
    if (!tgl) return '';
    const d = new Date(tgl);
    if (isNaN(d)) return tgl;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

function showLoginModal(callback) {
    if (typeof bootstrap !== 'undefined' && document.getElementById('loginModal')) {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        document.getElementById('loginError').style.display = 'none';
        document.getElementById('loginForm').onsubmit = function(e) {
            e.preventDefault();
            const user = document.getElementById('loginUsername').value;
            const pass = document.getElementById('loginPassword').value;
            fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            })
            .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('userRole', data.role || 'user');
                        modal.hide();
                        if (typeof callback === 'function') callback();
                    } else {
                        document.getElementById('loginError').textContent = data.message || 'Username atau password salah!';
                        document.getElementById('loginError').style.display = 'block';
                    }
            })
            .catch(() => {
                document.getElementById('loginError').textContent = 'Gagal terhubung ke server.';
                document.getElementById('loginError').style.display = 'block';
            });
        };
        modal.show();
    } else {
        alert('Login diperlukan. Silakan reload halaman.');
    }
}

 

function renderPaginationControls(total, page, perPage) {
    const controls = document.getElementById("paginationControls");
    controls.innerHTML = '';

    if (perPage === 'all' || total <= perPage) return;

    const totalPages = Math.ceil(total / perPage);

    function makePageItem(i, label = null, disabled = false, active = false) {
        return `<li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
            <button class="page-link" data-page="${i}">${label ?? i}</button>
        </li>`;
    }

    controls.innerHTML += makePageItem(page - 1, '«', page === 1);
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) {
            controls.innerHTML += makePageItem(i, null, false, i === page);
        } else if (i === page - 2 || i === page + 2) {
            controls.innerHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    controls.innerHTML += makePageItem(page + 1, '»', page === totalPages);

    controls.querySelectorAll("button.page-link").forEach(btn => {
        btn.addEventListener("click", function () {
            const goto = Number(this.dataset.page);
            if (!isNaN(goto) && goto >= 1 && goto <= totalPages) {
                currentPage = goto;
                updateTableDisplay();
            }
        });
    });
}

function renderPaginationInfo(total, page, perPage) {
    const info = document.getElementById("paginationInfo");
    if (perPage === 'all' || total <= perPage) {
        info.textContent = `Menampilkan semua (${total}) data`;
    } else {
        const start = (page - 1) * perPage + 1;
        const end = Math.min(page * perPage, total);
        info.textContent = `Menampilkan ${start}-${end} dari ${total} data`;
    }
}

function updateTableDisplay() {
    let total = filteredData.length;
    let dataToShow = [];

    if (perPage === 'all' || total <= perPage) {
        dataToShow = filteredData;
        renderPaginationControls(total, 1, 'all');
        renderPaginationInfo(total, 1, 'all');
    } else {
        const totalPages = Math.ceil(total / perPage);
        currentPage = Math.max(1, Math.min(currentPage, totalPages));
        const startIdx = (currentPage - 1) * perPage;
        const endIdx = Math.min(startIdx + perPage, total);
        dataToShow = filteredData.slice(startIdx, endIdx);
        renderPaginationControls(total, currentPage, perPage);
        renderPaginationInfo(total, currentPage, perPage);
    }
    renderTable(dataToShow);
    setExportHandler(dataToShow);
}

function filterData() {
    const keyword = searchKeyword.toLowerCase();
    return laporanData.filter(laporan =>
        Object.values(laporan).some(
            val => String(val || '').toLowerCase().includes(keyword)
        )
    );
}

let laporanUrl = '/api/laporan';
if (!isAdmin()) {
    const pid = localStorage.getItem('perseroanId');
    if (pid) laporanUrl += '?perseroan_id=' + encodeURIComponent(pid);
}
fetch(laporanUrl)
    .then(response => response.json())
    .then(async data => {
        
        laporanData = data.map(laporan => ({
            id: laporan.id,
            perseroan: laporan.perseroan || '',
            perseroan_id: (typeof laporan.perseroan_id !== 'undefined' && laporan.perseroan_id !== null) ? laporan.perseroan_id : (String(laporan.perseroan || '').match(/^\d+$/) ? Number(laporan.perseroan) : null),
            email: laporan.email || '',
            'Jenis Laporan': laporan.jenis_laporan || laporan.nama_laporan || '',
            'File': laporan.file || '',
            'Periode Laporan': laporan.periode_laporan || '',
            'Tahun Laporan': laporan.tahun_laporan || laporan.tahun_pelaporan || '',
            'Tahun Pelaporan': laporan.tahun_pelaporan || laporan.tahun_laporan || '',
            'Instansi Tujuan': laporan.instansi_tujuan || '',
            'Tanggal Pelaporan': laporan.tanggal_pelaporan || laporan.tanggal_dikirim || '',
            'Tanggal Dikirim': laporan.tanggal_dikirim || laporan.tanggal_pelaporan || '',
            'Keterangan': laporan.keterangan || '',
            'Status': laporan.status || ''
        }));

        
        const numericIds = new Set();
        laporanData.forEach(l => {
            const v = String(l.perseroan || '');
            if (v && /^\d+$/.test(v)) numericIds.add(v);
        });

        if (numericIds.size > 0) {
            
            const idArray = Array.from(numericIds);
            try {
                const promises = idArray.map(id => fetch('/api/perseroan?id=' + encodeURIComponent(id)).then(r => r.json()).catch(() => null));
                const results = await Promise.all(promises);
                const nameMap = {};
                results.forEach((res, idx) => {
                    const id = idArray[idx];
                    if (res && res.success && res.perseroan && res.perseroan.perseroan) {
                        nameMap[id] = res.perseroan.perseroan;
                    }
                });
                
                laporanData = laporanData.map(l => ({
                    ...l,
                    perseroan: (String(l.perseroan) && nameMap[String(l.perseroan)]) ? nameMap[String(l.perseroan)] : l.perseroan
                }));
            } catch (e) {
                console.warn('Failed to resolve perseroan names for numeric ids', e);
            }
        }

        filteredData = laporanData;
        updateTableDisplay();
    })
    .catch(error => {
        console.error("Gagal memuat data:", error);
        const tbody = document.querySelector("#laporanTable tbody");
        tbody.innerHTML = '<tr><td colspan="11" class="text-danger text-center">Gagal memuat data laporan</td></tr>';
    });

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchSpinner = document.getElementById('searchSpinner');
    const perPageSelect = document.getElementById('perPageSelect');

    let debounceTimeout = null;
    searchInput.addEventListener('input', (e) => {
        searchSpinner.style.display = 'inline-block';
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            searchKeyword = e.target.value.trim();
            filteredData = filterData();
            currentPage = 1;
            updateTableDisplay();
            searchSpinner.style.display = 'none';
        }, 400);
    });

    perPageSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        perPage = val === 'all' ? 'all' : Number(val);
        currentPage = 1;
        updateTableDisplay();
    });
});

 
function setExportHandler(dataToShow) {
    const exportBtn = document.getElementById('exportExcelBtn');
    if (!exportBtn) return;

    exportBtn.onclick = function () {
        
        const cleanData = dataToShow.map(laporan => ({
            "Perseroan": stripHtml(laporan['perseroan'] || ''),
            "Jenis Laporan": stripHtml(laporan['Jenis Laporan'] || laporan['Nama Laporan'] || ''),
            "Periode Laporan": stripHtml(laporan['Periode Laporan']),
            "Tahun Pelaporan": stripHtml(laporan['Tahun Laporan']),
            "Instansi Tujuan": stripHtml(laporan['Instansi Tujuan']),
            "Tanggal Pelaporan": stripHtml(laporan['Tanggal Pelaporan']),
            "Status": stripHtml(laporan['Status'] || laporan['status'] || ''),
            "Keterangan": stripHtml(laporan['Keterangan']),
            "File": stripHtml(laporan['File'] || '')
        }));

        const ws = XLSX.utils.json_to_sheet(cleanData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");
        XLSX.writeFile(wb, "dashboard_laporan_bsp.xlsx");
    }
}

 
function stripHtml(html) {
    let div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}
