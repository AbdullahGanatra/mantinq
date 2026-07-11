/* ============================================
   MaintainIQ - Asset Details Page Logic
   ============================================ */

let currentAsset = null;
let detailQrModal = null;

document.addEventListener('DOMContentLoaded', () => {
    detailQrModal = new bootstrap.Modal(document.getElementById('detailQrModal'));

    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id');

    if (assetId) {
        loadAssetDetails(assetId);
    } else {
        window.location.href = 'assets.html';
    }

    document.getElementById('generateQrBtn').addEventListener('click', () => {
        if (currentAsset) {
            generateDetailQR(currentAsset);
        }
    });

    document.getElementById('downloadDetailQr').addEventListener('click', () => {
        if (currentAsset) {
            downloadQRCode('detailQrContainer', `QR-${currentAsset.code}.png`);
        }
    });

    document.getElementById('modalDownloadQr').addEventListener('click', () => {
        if (currentAsset) {
            downloadQRCode('modalQrContainer', `QR-${currentAsset.code}.png`);
        }
    });
});

function loadAssetDetails(assetId) {
    currentAsset = getAssetById(assetId);
    if (!currentAsset) {
        window.location.href = 'assets.html';
        return;
    }

    // Populate asset info
    document.getElementById('detailAssetName').textContent = currentAsset.name;
    document.getElementById('detailAssetCode').textContent = currentAsset.code;
    document.getElementById('detailCategory').textContent = currentAsset.category;
    document.getElementById('detailLocation').textContent = currentAsset.location;
    document.getElementById('detailPurchaseDate').textContent = formatDate(currentAsset.purchaseDate);
    document.getElementById('detailStatus').innerHTML = getStatusBadge(currentAsset.status);
    document.getElementById('detailCreated').textContent = formatDateTime(currentAsset.createdAt);
    document.getElementById('detailDescription').textContent = currentAsset.description || 'No description available.';

    // Set public page link
    const publicUrl = getPublicAssetUrl(currentAsset.code);
    document.getElementById('publicPageLink').href = publicUrl;

    // Load stats
    loadAssetStats(assetId);

    // Load issues
    loadAssetIssues(assetId);

    // Load history
    loadAssetHistory(assetId);

    // Auto-generate QR if already generated
    if (currentAsset.qrGenerated) {
        generateDetailQR(currentAsset);
    }
}

function generateDetailQR(asset) {
    const container = document.getElementById('detailQrContainer');
    const publicUrl = getPublicAssetUrl(asset.code);

    container.innerHTML = '';
    generateQRCode('detailQrContainer', publicUrl, 180, 180);

    document.getElementById('qrActions').style.display = 'flex';

    // Mark as generated if not already
    if (!asset.qrGenerated) {
        const assets = getAssets();
        const index = assets.findIndex(a => a.id === asset.id);
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
}

function loadAssetStats(assetId) {
    const issues = getIssuesByAssetId(assetId);
    const maintenance = getMaintenanceByAssetId(assetId);

    document.getElementById('detailPendingIssues').textContent = issues.filter(i => i.status === 'Pending').length;
    document.getElementById('detailInProgressIssues').textContent = issues.filter(i => i.status === 'In Progress').length;
    document.getElementById('detailResolvedIssues').textContent = issues.filter(i => i.status === 'Resolved').length;
    document.getElementById('detailMaintenanceCount').textContent = maintenance.length;
}

function loadAssetIssues(assetId) {
    const issues = getIssuesByAssetId(assetId);
    const list = document.getElementById('detailIssuesList');
    const noMessage = document.getElementById('noIssuesMessage');

    if (!list) return;

    list.innerHTML = '';

    if (issues.length === 0) {
        noMessage.classList.remove('d-none');
        return;
    }

    noMessage.classList.add('d-none');

    issues.forEach(issue => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1 fw-semibold">${issue.title}</h6>
                    <p class="mb-1 text-muted small">${issue.description.substring(0, 80)}${issue.description.length > 80 ? '...' : ''}</p>
                    <small class="text-muted">${getStatusBadge(issue.status)} ${getPriorityBadge(issue.priority)}</small>
                </div>
                <small class="text-muted">${formatRelativeTime(issue.createdAt)}</small>
            </div>
        `;
        list.appendChild(item);
    });
}

function loadAssetHistory(assetId) {
    const history = getHistoryByAssetId(assetId).slice(0, 8);
    const timeline = document.getElementById('detailHistoryTimeline');

    if (!timeline) return;

    timeline.innerHTML = '';

    if (history.length === 0) {
        timeline.innerHTML = '<p class="text-muted text-center py-3 small">No history yet</p>';
        return;
    }

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot ${getHistoryDotClass(entry.type)}"></div>
            <div class="timeline-content">
                <div class="timeline-time">${formatRelativeTime(entry.timestamp)}</div>
                <div class="timeline-title">${entry.type}</div>
                <div class="timeline-desc">${entry.description}</div>
            </div>
        `;
        timeline.appendChild(item);
    });
}
