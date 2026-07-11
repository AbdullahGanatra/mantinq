/* ============================================
   MaintainIQ - Issue Management & Maintenance Logic
   ============================================ */

let currentUpdateIssueId = null;
let currentMaintIssueId = null;
let currentMaintAssetId = null;

let updateStatusModal, maintenanceModal, viewIssueModal;

document.addEventListener('DOMContentLoaded', () => {
    updateStatusModal = new bootstrap.Modal(document.getElementById('updateStatusModal'));
    maintenanceModal = new bootstrap.Modal(document.getElementById('maintenanceModal'));
    viewIssueModal = new bootstrap.Modal(document.getElementById('viewIssueModal'));

    loadIssuesTable();
    loadIssueStats();

    document.getElementById('updateStatusBtn').addEventListener('click', confirmUpdateStatus);
    document.getElementById('saveMaintenanceBtn').addEventListener('click', saveMaintenanceRecord);
    document.getElementById('newIssueStatus').addEventListener('change', handleStatusChange);

    // Search & Filter
    document.getElementById('searchIssues').addEventListener('input', debounce(filterIssues, 300));
    document.getElementById('filterIssueStatus').addEventListener('change', filterIssues);
    document.getElementById('filterIssuePriority').addEventListener('change', filterIssues);
    document.getElementById('clearIssueFilters').addEventListener('click', clearIssueFilters);
});

function loadIssuesTable(issues = null) {
    const data = issues || getIssues();
    const tbody = document.getElementById('issuesTableBody');
    const noMessage = document.getElementById('noIssuesMessage');
    const countBadge = document.getElementById('issueCountBadge');

    if (!tbody) return;

    countBadge.textContent = `${data.length} Issue${data.length !== 1 ? 's' : ''}`;

    if (data.length === 0) {
        tbody.innerHTML = '';
        noMessage.classList.remove('d-none');
        return;
    }

    noMessage.classList.add('d-none');
    tbody.innerHTML = '';

    // Sort by date (newest first)
    const sortedIssues = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedIssues.forEach(issue => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="bg-warning-soft rounded-circle me-2" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-exclamation-triangle text-warning small"></i>
                    </div>
                    <div>
                        <span class="fw-semibold d-block small">${issue.title}</span>
                        <small class="text-muted">${issue.reporterName}</small>
                    </div>
                </div>
            </td>
            <td>
                <span class="fw-semibold small">${issue.assetName}</span>
                <br><small class="text-muted">${issue.assetCode}</small>
            </td>
            <td>
                <span class="small">${issue.reporterName}</span>
                <br><small class="text-muted">${issue.reporterPhone}</small>
            </td>
            <td>${getPriorityBadge(issue.priority)}</td>
            <td>${getStatusBadge(issue.status)}</td>
            <td><span class="text-muted small">${formatRelativeTime(issue.createdAt)}</span></td>
            <td class="text-end">
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary rounded-start-pill" onclick="viewIssue('${issue.id}')" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="openUpdateStatus('${issue.id}')" title="Update Status">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadIssueStats() {
    const issues = getIssues();
    document.getElementById('statPending').textContent = issues.filter(i => i.status === 'Pending').length;
    document.getElementById('statInProgress').textContent = issues.filter(i => i.status === 'In Progress').length;
    document.getElementById('statResolved').textContent = issues.filter(i => i.status === 'Resolved').length;
}

function viewIssue(issueId) {
    const issue = getIssues().find(i => i.id === issueId);
    if (!issue) return;

    document.getElementById('viewIssueTitle').textContent = issue.title;
    document.getElementById('viewIssueAsset').textContent = issue.assetName;
    document.getElementById('viewIssuePriority').innerHTML = getPriorityBadge(issue.priority);
    document.getElementById('viewIssueStatus').innerHTML = getStatusBadge(issue.status);
    document.getElementById('viewIssueDate').textContent = formatDateTime(issue.createdAt);
    document.getElementById('viewIssueReporter').textContent = issue.reporterName;
    document.getElementById('viewIssuePhone').textContent = issue.reporterPhone;
    document.getElementById('viewIssueDescription').textContent = issue.description;

    viewIssueModal.show();
}

function openUpdateStatus(issueId) {
    const issue = getIssues().find(i => i.id === issueId);
    if (!issue) return;

    currentUpdateIssueId = issueId;
    document.getElementById('currentStatusDisplay').innerHTML = getStatusBadge(issue.status);
    document.getElementById('newIssueStatus').value = issue.status;

    handleStatusChange();
    updateStatusModal.show();
}

function handleStatusChange() {
    const newStatus = document.getElementById('newIssueStatus').value;
    const alert = document.getElementById('maintenanceAlert');

    if (newStatus === 'Resolved') {
        alert.classList.remove('d-none');
    } else {
        alert.classList.add('d-none');
    }
}

function confirmUpdateStatus() {
    if (!currentUpdateIssueId) return;

    const newStatus = document.getElementById('newIssueStatus').value;
    const issues = getIssues();
    const index = issues.findIndex(i => i.id === currentUpdateIssueId);

    if (index === -1) return;

    const issue = issues[index];
    const oldStatus = issue.status;

    if (oldStatus === newStatus) {
        updateStatusModal.hide();
        return;
    }

    issue.status = newStatus;
    issue.updatedAt = new Date().toISOString();
    saveIssues(issues);

    // Add history
    addHistoryEntry({
        type: 'Status Changed',
        assetId: issue.assetId,
        assetCode: issue.assetCode,
        assetName: issue.assetName,
        description: `Issue status changed from ${oldStatus} to ${newStatus}`
    });

    updateStatusModal.hide();

    // If resolved, show maintenance form
    if (newStatus === 'Resolved') {
        currentMaintIssueId = currentUpdateIssueId;
        currentMaintAssetId = issue.assetId;

        // Pre-fill date
        document.getElementById('maintenanceDate').value = new Date().toISOString().split('T')[0];

        setTimeout(() => {
            maintenanceModal.show();
        }, 300);
    }

    loadIssuesTable();
    loadIssueStats();
    filterIssues();

    showToast(`Issue status updated to ${newStatus}`);

    currentUpdateIssueId = null;
}

function saveMaintenanceRecord() {
    if (!currentMaintIssueId || !currentMaintAssetId) return;

    const technicianName = document.getElementById('technicianName').value.trim();
    const maintenanceDate = document.getElementById('maintenanceDate').value;
    const partsUsed = document.getElementById('partsUsed').value.trim();
    const cost = parseFloat(document.getElementById('maintenanceCost').value) || 0;
    const notes = document.getElementById('maintenanceNotes').value.trim();

    if (!technicianName || !maintenanceDate || !notes) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const issue = getIssues().find(i => i.id === currentMaintIssueId);
    if (!issue) return;

    const newMaintenance = {
        id: generateId(),
        issueId: currentMaintIssueId,
        assetId: currentMaintAssetId,
        assetCode: issue.assetCode,
        assetName: issue.assetName,
        technicianName,
        maintenanceDate,
        partsUsed,
        cost,
        notes,
        createdAt: new Date().toISOString()
    };

    const maintenance = getMaintenance();
    maintenance.push(newMaintenance);
    saveMaintenance(maintenance);

    // Add history entries
    addHistoryEntry({
        type: 'Maintenance Added',
        assetId: currentMaintAssetId,
        assetCode: issue.assetCode,
        assetName: issue.assetName,
        description: `Maintenance record added by ${technicianName}`
    });

    addHistoryEntry({
        type: 'Issue Resolved',
        assetId: currentMaintAssetId,
        assetCode: issue.assetCode,
        assetName: issue.assetName,
        description: `Issue resolved: ${issue.title}`
    });

    // Reset form
    document.getElementById('technicianName').value = '';
    document.getElementById('maintenanceDate').value = '';
    document.getElementById('partsUsed').value = '';
    document.getElementById('maintenanceCost').value = '';
    document.getElementById('maintenanceNotes').value = '';

    maintenanceModal.hide();

    loadIssuesTable();
    loadIssueStats();

    showToast('Maintenance record saved successfully!');

    currentMaintIssueId = null;
    currentMaintAssetId = null;
}

function filterIssues() {
    const searchTerm = document.getElementById('searchIssues').value.toLowerCase();
    const statusFilter = document.getElementById('filterIssueStatus').value;
    const priorityFilter = document.getElementById('filterIssuePriority').value;

    let issues = getIssues();

    if (searchTerm) {
        issues = issues.filter(issue => 
            issue.title.toLowerCase().includes(searchTerm) ||
            issue.assetName.toLowerCase().includes(searchTerm) ||
            issue.assetCode.toLowerCase().includes(searchTerm) ||
            issue.reporterName.toLowerCase().includes(searchTerm)
        );
    }

    if (statusFilter) {
        issues = issues.filter(issue => issue.status === statusFilter);
    }

    if (priorityFilter) {
        issues = issues.filter(issue => issue.priority === priorityFilter);
    }

    loadIssuesTable(issues);
}

function clearIssueFilters() {
    document.getElementById('searchIssues').value = '';
    document.getElementById('filterIssueStatus').value = '';
    document.getElementById('filterIssuePriority').value = '';
    loadIssuesTable();
}
