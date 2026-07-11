/* ============================================
   MaintainIQ - Public Asset Page & Issue Report Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const assetCode = urlParams.get('code');

    if (assetCode) {
        loadPublicAsset(assetCode);
    } else {
        showAssetNotFound();
    }

    document.getElementById('reportIssueForm').addEventListener('submit', submitIssue);
});

function loadPublicAsset(code) {
    const asset = getAssetByCode(code);

    if (!asset) {
        showAssetNotFound();
        return;
    }

    // Populate asset info
    document.getElementById('publicAssetName').textContent = asset.name;
    document.getElementById('publicAssetCode').textContent = asset.code;
    document.getElementById('publicCategory').textContent = asset.category;
    document.getElementById('publicLocation').textContent = asset.location;
    document.getElementById('publicStatus').innerHTML = getStatusBadge(asset.status);
    document.getElementById('publicPurchaseDate').textContent = formatDate(asset.purchaseDate);

    // Generate QR code for the public page
    const publicUrl = getPublicAssetUrl(asset.code);
    generateQRCode('publicQrContainer', publicUrl, 120, 120);

    // Store current asset for form submission
    window.currentPublicAsset = asset;
}

function showAssetNotFound() {
    document.getElementById('publicAssetName').closest('.card').classList.add('d-none');
    document.getElementById('reportIssueForm').closest('.card').classList.add('d-none');
    document.getElementById('assetNotFound').classList.remove('d-none');
}

function submitIssue(e) {
    e.preventDefault();

    const asset = window.currentPublicAsset;
    if (!asset) {
        showToast('Asset not found', 'danger');
        return;
    }

    const reporterName = document.getElementById('reporterName').value.trim();
    const reporterPhone = document.getElementById('reporterPhone').value.trim();
    const title = document.getElementById('issueTitle').value.trim();
    const priority = document.getElementById('issuePriority').value;
    const description = document.getElementById('issueDescription').value.trim();

    if (!reporterName || !reporterPhone || !title || !description) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const newIssue = {
        id: generateId(),
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        reporterName,
        reporterPhone,
        title,
        description,
        priority,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const issues = getIssues();
    issues.push(newIssue);
    saveIssues(issues);

    // Add history entry
    addHistoryEntry({
        type: 'Issue Reported',
        assetId: asset.id,
        assetCode: asset.code,
        assetName: asset.name,
        description: `Issue reported: ${title}`
    });

    // Reset form
    document.getElementById('reportIssueForm').reset();

    // Show success toast
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
