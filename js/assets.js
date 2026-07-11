/* ============================================
   MaintainIQ - Asset Management Logic
   ============================================ */

let currentDeleteAssetId = null;
let currentQrAsset = null;

// Modals
let addAssetModal, editAssetModal, qrModal, deleteModal;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize modals
    addAssetModal = new bootstrap.Modal(document.getElementById('addAssetModal'));
    editAssetModal = new bootstrap.Modal(document.getElementById('editAssetModal'));
    qrModal = new bootstrap.Modal(document.getElementById('qrModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

    // Load assets
    loadAssetsTable();

    // Event listeners
    document.getElementById('saveAssetBtn').addEventListener('click', saveNewAsset);
    document.getElementById('updateAssetBtn').addEventListener('click', updateExistingAsset);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteAsset);
    document.getElementById('downloadQrBtn').addEventListener('click', () => {
        if (currentQrAsset) {
            downloadQRCode('qrCodeContainer', `QR-${currentQrAsset.code}.png`);
        }
    });

    // Search & Filter
    document.getElementById('searchAssets').addEventListener('input', debounce(filterAssets, 300));
    document.getElementById('filterCategory').addEventListener('change', filterAssets);
    document.getElementById('filterStatus').addEventListener('change', filterAssets);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
});

function loadAssetsTable() {
    const assets = getAssets();
    renderAssetsTable(assets);
}

function renderAssetsTable(assets) {
    const tbody = document.getElementById('assetsTableBody');
    const noMessage = document.getElementById('noAssetsMessage');
    const countBadge = document.getElementById('assetCountBadge');

    if (!tbody) return;

    countBadge.textContent = `${assets.length} Asset${assets.length !== 1 ? 's' : ''}`;

    if (assets.length === 0) {
        tbody.innerHTML = '';
        noMessage.classList.remove('d-none');
        return;
    }

    noMessage.classList.add('d-none');
    tbody.innerHTML = '';

    assets.forEach(asset => {
        const issues = getIssuesByAssetId(asset.id);
        const openIssues = issues.filter(i => i.status !== 'Resolved').length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-primary-soft rounded-circle me-2" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-box text-primary small"></i>
                    </div>
                    <div>
                        <span class="fw-semibold d-block">${asset.name}</span>
                        <small class="text-muted">${asset.category}</small>
                    </div>
                </div>
            </td>
            <td><span class="badge bg-light text-dark border">${asset.code}</span></td>
            <td><span class="fw-semibold small">${asset.category}</span></td>
            <td><span class="text-muted small"><i class="fas fa-map-marker-alt me-1"></i>${asset.location}</span></td>
            <td>${getStatusBadge(asset.status)}</td>
            <td>
                ${openIssues > 0 
                    ? `<span class="badge bg-danger rounded-pill">${openIssues} open</span>` 
                    : '<span class="badge bg-success rounded-pill">0 open</span>'}
            </td>
            <td class="text-end">
                <div class="btn-group">
                    <a href="asset-details.html?id=${asset.id}" class="btn btn-sm btn-outline-primary rounded-start-pill" title="View">
                        <i class="fas fa-eye"></i>
                    </a>
                    <button class="btn btn-sm btn-outline-warning" onclick="openEditModal('${asset.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="openQrModal('${asset.id}')" title="QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-end-pill" onclick="openDeleteModal('${asset.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveNewAsset() {
    const name = document.getElementById('assetName').value.trim();
    const code = document.getElementById('assetCode').value.trim();
    const category = document.getElementById('assetCategory').value;
    const location = document.getElementById('assetLocation').value.trim();
    const purchaseDate = document.getElementById('assetPurchaseDate').value;
    const status = document.getElementById('assetStatus').value;
    const description = document.getElementById('assetDescription').value.trim();

    // Validation
    if (!name || !code || !category || !location) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    // Check for duplicate code
    if (isAssetCodeExists(code)) {
        document.getElementById('assetCode').classList.add('is-invalid');
        showToast('Asset code already exists!', 'danger');
        return;
    }

    document.getElementById('assetCode').classList.remove('is-invalid');

    const newAsset = {
        id: generateId(),
        name,
        code,
        category,
        location,
        purchaseDate,
        status,
        description,
        createdAt: new Date().toISOString(),
        qrGenerated: false
    };

    const assets = getAssets();
    assets.push(newAsset);
    saveAssets(assets);

    // Add history
    addHistoryEntry({
        type: 'Asset Created',
        assetId: newAsset.id,
        assetCode: newAsset.code,
        assetName: newAsset.name,
        description: `Asset "${newAsset.name}" created`
    });

    // Reset form and close modal
    document.getElementById('addAssetForm').reset();
    addAssetModal.hide();

    // Reload table
    loadAssetsTable();
    filterAssets();

    showToast(`Asset "${name}" created successfully!`);
}

function openEditModal(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;

    document.getElementById('editAssetId').value = asset.id;
    document.getElementById('editAssetName').value = asset.name;
    document.getElementById('editAssetCode').value = asset.code;
    document.getElementById('editAssetCategory').value = asset.category;
    document.getElementById('editAssetLocation').value = asset.location;
    document.getElementById('editAssetPurchaseDate').value = asset.purchaseDate || '';
    document.getElementById('editAssetStatus').value = asset.status;
    document.getElementById('editAssetDescription').value = asset.description || '';

    editAssetModal.show();
}

function updateExistingAsset() {
    const id = document.getElementById('editAssetId').value;
    const name = document.getElementById('editAssetName').value.trim();
    const category = document.getElementById('editAssetCategory').value;
    const location = document.getElementById('editAssetLocation').value.trim();
    const purchaseDate = document.getElementById('editAssetPurchaseDate').value;
    const status = document.getElementById('editAssetStatus').value;
    const description = document.getElementById('editAssetDescription').value.trim();

    if (!name || !category || !location) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const assets = getAssets();
    const index = assets.findIndex(a => a.id === id);
    if (index === -1) return;

    const oldAsset = assets[index];
    assets[index] = {
        ...oldAsset,
        name,
        category,
        location,
        purchaseDate,
        status,
        description
    };

    saveAssets(assets);

    addHistoryEntry({
        type: 'Asset Updated',
        assetId: id,
        assetCode: oldAsset.code,
        assetName: name,
        description: `Asset "${name}" updated`
    });

    editAssetModal.hide();
    loadAssetsTable();
    filterAssets();

    showToast(`Asset "${name}" updated successfully!`);
}

function openQrModal(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;

    currentQrAsset = asset;

    document.getElementById('qrAssetName').textContent = asset.name;
    document.getElementById('qrAssetCode').textContent = asset.code;

    const publicUrl = getPublicAssetUrl(asset.code);
    generateQRCode('qrCodeContainer', publicUrl, 220, 220);

    document.getElementById('openAssetPageBtn').href = publicUrl;

    // Mark QR as generated
    if (!asset.qrGenerated) {
        const assets = getAssets();
        const index = assets.findIndex(a => a.id === assetId);
        if (index !== -1) {
            assets[index].qrGenerated = true;
            saveAssets(assets);

            addHistoryEntry({
                type: 'QR Generated',
                assetId: asset.id,
                assetCode: asset.code,
                assetName: asset.name,
                description: `QR code generated for ${asset.name}`
            });
        }
    }

    qrModal.show();
}

function openDeleteModal(assetId) {
    const asset = getAssetById(assetId);
    if (!asset) return;

    currentDeleteAssetId = assetId;
    document.getElementById('deleteAssetName').textContent = asset.name;
    deleteModal.show();
}

function confirmDeleteAsset() {
    if (!currentDeleteAssetId) return;

    const asset = getAssetById(currentDeleteAssetId);
    if (!asset) return;

    // Remove asset
    let assets = getAssets();
    assets = assets.filter(a => a.id !== currentDeleteAssetId);
    saveAssets(assets);

    // Remove related issues
    let issues = getIssues();
    issues = issues.filter(i => i.assetId !== currentDeleteAssetId);
    saveIssues(issues);

    // Remove related maintenance
    let maintenance = getMaintenance();
    maintenance = maintenance.filter(m => m.assetId !== currentDeleteAssetId);
    saveMaintenance(maintenance);

    // Add history
    addHistoryEntry({
        type: 'Asset Deleted',
        assetId: currentDeleteAssetId,
        assetCode: asset.code,
        assetName: asset.name,
        description: `Asset "${asset.name}" deleted`
    });

    deleteModal.hide();
    currentDeleteAssetId = null;

    loadAssetsTable();
    filterAssets();

    showToast(`Asset "${asset.name}" deleted successfully!`);
}

function filterAssets() {
    const searchTerm = document.getElementById('searchAssets').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const statusFilter = document.getElementById('filterStatus').value;

    let assets = getAssets();

    if (searchTerm) {
        assets = assets.filter(asset => 
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.code.toLowerCase().includes(searchTerm) ||
            asset.location.toLowerCase().includes(searchTerm)
        );
    }

    if (categoryFilter) {
        assets = assets.filter(asset => asset.category === categoryFilter);
    }

    if (statusFilter) {
        assets = assets.filter(asset => asset.status === statusFilter);
    }

    renderAssetsTable(assets);
}

function clearFilters() {
    document.getElementById('searchAssets').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterStatus').value = '';
    loadAssetsTable();
}
