/* ============================================
   MaintainIQ - Activity History Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    loadHistoryTimeline();
    populateAssetFilter();

    document.getElementById('searchHistory').addEventListener('input', debounce(filterHistory, 300));
    document.getElementById('filterActivityType').addEventListener('change', filterHistory);
    document.getElementById('filterHistoryAsset').addEventListener('change', filterHistory);
    document.getElementById('clearHistoryFilters').addEventListener('click', clearHistoryFilters);
});

function loadHistoryTimeline(historyData = null) {
    const history = historyData || getHistory();
    const timeline = document.getElementById('historyTimeline');
    const noMessage = document.getElementById('noHistoryMessage');
    const countBadge = document.getElementById('historyCountBadge');

    if (!timeline) return;

    countBadge.textContent = `${history.length} Activit${history.length !== 1 ? 'ies' : 'y'}`;

    if (history.length === 0) {
        timeline.innerHTML = '';
        noMessage.classList.remove('d-none');
        return;
    }

    noMessage.classList.add('d-none');
    timeline.innerHTML = '';

    history.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="timeline-dot ${getHistoryDotClass(entry.type)}"></div>
            <div class="timeline-content">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <div>
                        <span class="timeline-title">${entry.type}</span>
                        <span class="badge bg-light text-dark border ms-2">${entry.assetCode}</span>
                    </div>
                    <small class="text-muted">${formatRelativeTime(entry.timestamp)}</small>
                </div>
                <p class="timeline-desc mb-1">${entry.description}</p>
                <small class="text-muted">
                    <i class="fas fa-box me-1"></i>${entry.assetName}
                    <span class="mx-2">|</span>
                    <i class="fas fa-clock me-1"></i>${formatDateTime(entry.timestamp)}
                </small>
            </div>
        `;
        timeline.appendChild(item);
    });
}

function populateAssetFilter() {
    const assets = getAssets();
    const select = document.getElementById('filterHistoryAsset');
    if (!select) return;

    // Keep the first option
    const firstOption = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (firstOption) select.appendChild(firstOption);

    assets.forEach(asset => {
        const option = document.createElement('option');
        option.value = asset.id;
        option.textContent = `${asset.name} (${asset.code})`;
        select.appendChild(option);
    });
}

function filterHistory() {
    const searchTerm = document.getElementById('searchHistory').value.toLowerCase();
    const typeFilter = document.getElementById('filterActivityType').value;
    const assetFilter = document.getElementById('filterHistoryAsset').value;

    let history = getHistory();

    if (searchTerm) {
        history = history.filter(entry => 
            entry.type.toLowerCase().includes(searchTerm) ||
            entry.description.toLowerCase().includes(searchTerm) ||
            entry.assetName.toLowerCase().includes(searchTerm) ||
            entry.assetCode.toLowerCase().includes(searchTerm)
        );
    }

    if (typeFilter) {
        history = history.filter(entry => entry.type === typeFilter);
    }

    if (assetFilter) {
        history = history.filter(entry => entry.assetId === assetFilter);
    }

    loadHistoryTimeline(history);
}

function clearHistoryFilters() {
    document.getElementById('searchHistory').value = '';
    document.getElementById('filterActivityType').value = '';
    document.getElementById('filterHistoryAsset').value = '';
    loadHistoryTimeline();
}
