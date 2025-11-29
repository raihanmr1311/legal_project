document.addEventListener('DOMContentLoaded', function() {
    var tambahBtn = document.getElementById('tambahLaporanBtn');
    if (tambahBtn) {
        tambahBtn.addEventListener('click', function() {
            if (!isLoggedIn()) {
                showLoginModal(function() {
                    window.location.href = 'form-laporan.html';
                });
            } else {
                window.location.href = 'form-laporan.html';
            }
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

function renderTable(data) {
    const tbody = document.querySelector("#laporanTable tbody");
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Tidak ada data ditemukan</td></tr>';
        return;
    }
    data.forEach((laporan, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML =
            '<td>' + (idx + 1) + '</td>' +
            '<td>' + highlight(laporan['pj'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['email'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Nama Laporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Periode Laporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Tahun Pelaporan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(laporan['Instansi Tujuan'] || '', searchKeyword) + '</td>' +
            '<td>' + highlight(formatTanggal(laporan['Tanggal Pelaporan'] || laporan['tanggal_pelaporan'] || ''), searchKeyword) + '</td>' +
            '<td>' + (laporan['Keterangan'] ? highlight(laporan['Keterangan'], searchKeyword) : '-') + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-info me-1" title="Lihat Detail" onclick="detailLaporan(' + idx + ')"><i class="bi bi-eye"></i></button>' +
                '<button class="btn btn-sm btn-primary me-1" title="Edit" onclick="editLaporan(' + idx + ')"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-sm btn-danger" title="Hapus" onclick="hapusLaporan(' + idx + ')"><i class="bi bi-trash"></i></button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

    globalThis.detailLaporan = function(idx) {
    const laporan = filteredData[idx];
    if (!laporan) return;
    let html = '';
    html += '<div class="mb-2"><strong>Penanggung Jawab:</strong> ' + (laporan['pj'] || '-') + '</div>';
    html += '<div class="mb-2"><strong>Nama Laporan:</strong> ' + (laporan['Nama Laporan'] || '-') + '</div>';
    html += '<div class="mb-2"><strong>Periode Laporan:</strong> ' + (laporan['Periode Laporan'] || '-') + '</div>';
    html += '<div class="mb-2"><strong>Tahun Pelaporan:</strong> ' + (laporan['Tahun Pelaporan'] || '-') + '</div>';
    html += '<div class="mb-2"><strong>Instansi Tujuan:</strong> ' + (laporan['Instansi Tujuan'] || '-') + '</div>';
    const tanggalForDisplay = formatTanggal(laporan['Tanggal Pelaporan'] || laporan['tanggal_pelaporan'] || '');
    html += '<div class="mb-2"><strong>Tanggal Pelaporan:</strong> ' + (tanggalForDisplay || '-') + '</div>';
    html += '<div class="mb-2"><strong>Keterangan:</strong> ' + (laporan['Keterangan'] || '-') + '</div>';
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
    let html = '';
    html += '<div class="mb-2"><label class="form-label">Penanggung Jawab</label><input type="text" class="form-control" name="pj" value="' + (laporan['pj'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Nama Laporan</label><input type="text" class="form-control" name="nama_laporan" value="' + (laporan['Nama Laporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Periode Laporan</label><input type="text" class="form-control" name="periode_laporan" value="' + (laporan['Periode Laporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Tahun Pelaporan</label><input type="text" class="form-control" name="tahun_pelaporan" value="' + (laporan['Tahun Pelaporan'] || '') + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Instansi Tujuan</label><input type="text" class="form-control" name="instansi_tujuan" value="' + (laporan['Instansi Tujuan'] || '') + '" required></div>';
    let tglValue = (laporan['Tanggal Pelaporan'] || '').slice(0, 10);
    html += '<div class="mb-2"><label class="form-label">Tanggal Pelaporan</label><input type="date" class="form-control" name="tanggal_pelaporan" value="' + tglValue + '" required></div>';
    html += '<div class="mb-2"><label class="form-label">Keterangan</label><input type="text" class="form-control" name="keterangan" value="' + (laporan['Keterangan'] || '') + '"></div>';
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
                pj: form.pj.value,
                nama_laporan: form.nama_laporan.value,
                periode_laporan: form.periode_laporan.value,
                tahun_pelaporan: form.tahun_pelaporan.value,
                instansi_tujuan: form.instansi_tujuan.value,
                tanggal_pelaporan: form.tanggal_pelaporan.value,
                keterangan: form.keterangan.value
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
                        pj: data.pj,
                        'Nama Laporan': data.nama_laporan,
                        'Periode Laporan': data.periode_laporan,
                        'Tahun Pelaporan': data.tahun_pelaporan,
                        'Instansi Tujuan': data.instansi_tujuan,
                        'Tanggal Pelaporan': data.tanggal_pelaporan,
                        'Keterangan': data.keterangan
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
    if (laporan) {
        html += '<hr class="my-2">';
        html += '<div><strong>Nama Laporan:</strong> ' + (laporan['Nama Laporan'] || '-') + '</div>';
        html += '<div><strong>Penanggung Jawab:</strong> ' + (laporan['pj'] || '-') + '</div>';
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
                if (data.success && data.role === 'admin') {
                    localStorage.setItem('isLoggedIn', 'true');
                    modal.hide();
                    if (typeof callback === 'function') callback();
                } else if (data.success) {
                    document.getElementById('loginError').textContent = 'Hanya admin yang diizinkan.';
                    document.getElementById('loginError').style.display = 'block';
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
            val => val.toLowerCase().includes(keyword)
        )
    );
}

fetch('/api/laporan')
    .then(response => response.json())
    .then(data => {
        laporanData = data.map(laporan => ({
            id: laporan.id,
            pj: laporan.pj || '',
            email: laporan.email || '',
            'Nama Laporan': laporan.nama_laporan || '',
            'Periode Laporan': laporan.periode_laporan || '',
            'Tahun Pelaporan': laporan.tahun_pelaporan || '',
            'Instansi Tujuan': laporan.instansi_tujuan || '',
            'Tanggal Pelaporan': laporan.tanggal_pelaporan || '',
            'Keterangan': laporan.keterangan || ''
        }));
        filteredData = laporanData;
        updateTableDisplay();
    })
    .catch(error => {
        console.error("Gagal memuat data:", error);
        const tbody = document.querySelector("#laporanTable tbody");
        tbody.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Gagal memuat data laporan</td></tr>';
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
            "Penanggung Jawab": stripHtml(laporan['pj']),
            "Nama Laporan": stripHtml(laporan['Nama Laporan']),
            "Periode Laporan": stripHtml(laporan['Periode Laporan']),
            "Tahun Pelaporan": stripHtml(laporan['Tahun Pelaporan']),
            "Instansi Tujuan": stripHtml(laporan['Instansi Tujuan']),
            "Tanggal Pelaporan": stripHtml(laporan['Tanggal Pelaporan']),
            "Keterangan": stripHtml(laporan['Keterangan'])
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
