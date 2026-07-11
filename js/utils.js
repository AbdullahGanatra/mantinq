/* ============================================
   MaintainIQ - Utility Functions
   ============================================ */

// ============================================
// Date & Time Formatting
// ============================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatRelativeTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    if (diffWeek < 4) return `${diffWeek}w ago`;
    if (diffMonth < 12) return `${diffMonth}mo ago`;
    return `${diffYear}y ago`;
}

// ============================================
// Status & Priority Badges
// ============================================

function getStatusBadge(status) {
    const statusColors = {
        'Active': 'bg-success',
        'Inactive': 'bg-secondary',
        'Under Maintenance': 'bg-warning text-dark',
        'Pending': 'bg-warning text-dark',
        'In Progress': 'bg-info text-dark',
        'Resolved': 'bg-success',
        'Critical': 'bg-danger',
        'High': 'bg-danger',
        'Medium': 'bg-warning text-dark',
        'Low': 'bg-secondary'
    };
    const colorClass = statusColors[status] || 'bg-secondary';
    return `<span class="badge ${colorClass} rounded-pill">${status}</span>`;
}

function getPriorityBadge(priority) {
    const priorityColors = {
        'Critical': 'bg-danger',
        'High': 'bg-danger',
        'Medium': 'bg-warning text-dark',
        'Low': 'bg-secondary'
    };
    const colorClass = priorityColors[priority] || 'bg-secondary';
    return `<span class="badge ${colorClass} rounded-pill">${priority}</span>`;
}

// ============================================
// Category Colors
// ============================================

function getCategoryColor(category) {
    const colors = {
        'Electronics': '#4f46e5',
        'Machinery': '#06b6d4',
        'Furniture': '#8b5cf6',
        'Vehicle': '#f59e0b',
        'IT Equipment': '#10b981',
        'HVAC': '#ef4444'
    };
    return colors[category] || '#64748b';
}

// ============================================
// History Type Icons & Colors
// ============================================

function getHistoryIcon(type) {
    const icons = {
        'Asset Created': 'fa-plus-circle',
        'QR Generated': 'fa-qrcode',
        'Issue Reported': 'fa-exclamation-triangle',
        'Status Changed': 'fa-exchange-alt',
        'Maintenance Added': 'fa-tools',
        'Issue Resolved': 'fa-check-circle',
        'Asset Updated': 'fa-edit',
        'Asset Deleted': 'fa-trash-alt'
    };
    return icons[type] || 'fa-circle';
}

function getHistoryDotClass(type) {
    const classes = {
        'Asset Created': 'created',
        'QR Generated': 'qr',
        'Issue Reported': 'issue',
        'Status Changed': 'status',
        'Maintenance Added': 'maintenance',
        'Issue Resolved': 'resolved',
        'Asset Updated': 'updated',
        'Asset Deleted': 'deleted'
    };
    return classes[type] || '';
}

// ============================================
// Sidebar Toggle
// ============================================

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.add('show');
            if (sidebarOverlay) sidebarOverlay.classList.add('show');
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('show');
            if (sidebarOverlay) sidebarOverlay.classList.remove('show');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
    }
}

// ============================================
// Reset Data Button
// ============================================

function initResetButton() {
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all demo data? This will restore the original 5 assets and their data.')) {
                resetDemoData();
                window.location.reload();
            }
        });
    }
}

// ============================================
// Toast Notifications
// ============================================

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toastId = 'toast-' + Date.now();

    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';
    const iconClass = type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle';

    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas ${iconClass} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// ============================================
// QR Code Generator
// ============================================

function generateQRCode(containerId, text, width = 200, height = 200) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    container.innerHTML = '';

    const qr = new QRCode(container, {
        text: text,
        width: width,
        height: height,
        colorDark: '#1e293b',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    return qr;
}

function downloadQRCode(containerId, filename) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const img = container.querySelector('img');
    if (img) {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = filename || 'qrcode.png';
        link.click();
    }
}

function getPublicAssetUrl(assetCode) {
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
    return `${baseUrl}/report-issue.html?code=${assetCode}`;
}

// ============================================
// Search & Filter Helpers
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// Initialize Common Features
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initResetButton();
});
