/* ============================================
   MaintainIQ - Dashboard Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    loadRecentActivity();
    loadCategoryBreakdown();
});

function loadDashboardData() {
    const assets = getAssets();
    const issues = getIssues();
    const maintenance = getMaintenance();

    // Update stat cards
    document.getElementById('totalAssets').textContent = assets.length;
    document.getElementById('pendingIssues').textContent = issues.filter(i => i.status === 'Pending').length;
    document.getElementById('resolvedIssues').textContent = issues.filter(i => i.status === 'Resolved').length;
    document.getElementById('maintenanceRecords').textContent = maintenance.length;

    // Update progress bars
    const totalIssues = issues.length || 1;
    const pendingCount = issues.filter(i => i.status === 'Pending').length;
    const progressCount = issues.filter(i => i.status === 'In Progress').length;
    const resolvedCount = issues.filter(i => i.status === 'Resolved').length;

    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('progressCount').textContent = progressCount;
    document.getElementById('resolvedCount').textContent = resolvedCount;

    document.getElementById('pendingBar').style.width = `${(pendingCount / totalIssues) * 100}%`;
    document.getElementById('progressBar').style.width = `${(progressCount / totalIssues) * 100}%`;
    document.getElementById('resolvedBar').style.width = `${(resolvedCount / totalIssues) * 100}%`;
}

function loadCategoryBreakdown() {
    const assets = getAssets();
    const categories = {};

    assets.forEach(asset => {
        categories[asset.category] = (categories[asset.category] || 0) + 1;
    });

    const total = assets.length || 1;
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(categories).forEach(([category, count]) => {
        const percentage = Math.round((count / total) * 100);
        const color = getCategoryColor(category);

        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = `
            <div class="category-dot" style="background: ${color}"></div>
            <div class="flex-grow-1">
                <div class="category-info">
                    <span class="fw-semibold small">${category}</span>
                    <span class="fw-bold small">${count}</span>
                </div>
                <div class="category-bar">
                    <div class="category-bar-fill" style="width: ${percentage}%; background: ${color}"></div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function loadRecentActivity() {
    const history = getHistory().slice(0, 10);
    const tbody = document.getElementById('recentActivityTable');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">No recent activity</td>
            </tr>
        `;
        return;
    }

    history.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-primary-soft rounded-circle p-2 me-2" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas ${getHistoryIcon(entry.type)} text-primary small"></i>
                    </div>
                    <span class="fw-semibold small">${entry.type}</span>
                </div>
            </td>
            <td>
                <span class="fw-semibold small">${entry.assetName}</span>
                <br><small class="text-muted">${entry.assetCode}</small>
            </td>
            <td><span class="text-muted small">${entry.description}</span></td>
            <td><span class="text-muted small">${formatRelativeTime(entry.timestamp)}</span></td>
            <td>${getStatusBadge(entry.type === 'Issue Resolved' ? 'Resolved' : entry.type === 'Issue Reported' ? 'Pending' : 'Active')}</td>
        `;
        tbody.appendChild(row);
    });
}
