/* ============================================
   MaintainIQ - Storage Manager
   Handles all localStorage operations
   ============================================ */

const STORAGE_KEYS = {
    ASSETS: 'maintainiq_assets',
    ISSUES: 'maintainiq_issues',
    MAINTENANCE: 'maintainiq_maintenance',
    HISTORY: 'maintainiq_history',
    INITIALIZED: 'maintainiq_initialized'
};

// Demo data for preloading
const DEMO_ASSETS = [
    {
        id: 'asset-1',
        name: 'Server Rack A1',
        code: 'AC-001',
        category: 'IT Equipment',
        location: 'Data Center, Building A',
        purchaseDate: '2023-01-15',
        description: 'Primary server rack containing 12 Dell PowerEdge servers for production environment.',
        status: 'Active',
        createdAt: '2024-01-10T08:00:00Z',
        qrGenerated: true
    },
    {
        id: 'asset-2',
        name: 'HVAC Unit B3',
        code: 'AC-002',
        category: 'HVAC',
        location: 'Building B, Floor 3',
        purchaseDate: '2022-06-20',
        description: 'Central air conditioning unit for Building B, 5-ton capacity.',
        status: 'Under Maintenance',
        createdAt: '2024-01-10T08:05:00Z',
        qrGenerated: true
    },
    {
        id: 'asset-3',
        name: 'CNC Machine X200',
        code: 'AC-003',
        category: 'Machinery',
        location: 'Workshop, Building C',
        purchaseDate: '2023-03-10',
        description: 'Precision CNC milling machine for metal fabrication.',
        status: 'Active',
        createdAt: '2024-01-10T08:10:00Z',
        qrGenerated: true
    },
    {
        id: 'asset-4',
        name: 'Conference Room Projector',
        code: 'AC-004',
        category: 'Electronics',
        location: 'Conference Room 101',
        purchaseDate: '2023-09-01',
        description: '4K laser projector for main conference room presentations.',
        status: 'Active',
        createdAt: '2024-01-10T08:15:00Z',
        qrGenerated: true
    },
    {
        id: 'asset-5',
        name: 'Forklift FL-05',
        code: 'AC-005',
        category: 'Vehicle',
        location: 'Warehouse, Zone D',
        purchaseDate: '2022-11-30',
        description: '5-ton capacity electric forklift for warehouse operations.',
        status: 'Inactive',
        createdAt: '2024-01-10T08:20:00Z',
        qrGenerated: true
    }
];

const DEMO_ISSUES = [
    {
        id: 'issue-1',
        assetId: 'asset-2',
        assetCode: 'AC-002',
        assetName: 'HVAC Unit B3',
        reporterName: 'John Smith',
        reporterPhone: '+1-555-0101',
        title: 'HVAC not cooling properly',
        description: 'The HVAC unit in Building B is not maintaining the set temperature. Room temperature reaches 28°C instead of the desired 22°C.',
        priority: 'High',
        status: 'In Progress',
        createdAt: '2024-01-12T10:30:00Z',
        updatedAt: '2024-01-13T14:00:00Z'
    },
    {
        id: 'issue-2',
        assetId: 'asset-1',
        assetCode: 'AC-001',
        assetName: 'Server Rack A1',
        reporterName: 'Sarah Johnson',
        reporterPhone: '+1-555-0102',
        title: 'Server 3 showing overheating warning',
        description: 'Server 3 in rack A1 is showing critical temperature warnings. CPU temperature at 85°C.',
        priority: 'Critical',
        status: 'Pending',
        createdAt: '2024-01-14T09:15:00Z',
        updatedAt: '2024-01-14T09:15:00Z'
    },
    {
        id: 'issue-3',
        assetId: 'asset-5',
        assetCode: 'AC-005',
        assetName: 'Forklift FL-05',
        reporterName: 'Mike Davis',
        reporterPhone: '+1-555-0103',
        title: 'Forklift battery needs replacement',
        description: 'Forklift battery is not holding charge. Needs to be replaced with a new one.',
        priority: 'Medium',
        status: 'Resolved',
        createdAt: '2024-01-08T16:00:00Z',
        updatedAt: '2024-01-11T11:30:00Z'
    }
];

const DEMO_MAINTENANCE = [
    {
        id: 'maint-1',
        issueId: 'issue-3',
        assetId: 'asset-5',
        assetCode: 'AC-005',
        assetName: 'Forklift FL-05',
        technicianName: 'Robert Chen',
        maintenanceDate: '2024-01-11',
        partsUsed: '48V Battery Pack, Battery Cables',
        cost: 2450.00,
        notes: 'Replaced the old battery pack with a new 48V lithium-ion battery. Updated charging system firmware. Tested for 2 hours - all systems normal.',
        createdAt: '2024-01-11T11:30:00Z'
    }
];

const DEMO_HISTORY = [
    { id: 'hist-1', type: 'Asset Created', assetId: 'asset-1', assetCode: 'AC-001', assetName: 'Server Rack A1', description: 'Asset created and registered', timestamp: '2024-01-10T08:00:00Z' },
    { id: 'hist-2', type: 'QR Generated', assetId: 'asset-1', assetCode: 'AC-001', assetName: 'Server Rack A1', description: 'QR code generated for asset', timestamp: '2024-01-10T08:01:00Z' },
    { id: 'hist-3', type: 'Asset Created', assetId: 'asset-2', assetCode: 'AC-002', assetName: 'HVAC Unit B3', description: 'Asset created and registered', timestamp: '2024-01-10T08:05:00Z' },
    { id: 'hist-4', type: 'QR Generated', assetId: 'asset-2', assetCode: 'AC-002', assetName: 'HVAC Unit B3', description: 'QR code generated for asset', timestamp: '2024-01-10T08:06:00Z' },
    { id: 'hist-5', type: 'Asset Created', assetId: 'asset-3', assetCode: 'AC-003', assetName: 'CNC Machine X200', description: 'Asset created and registered', timestamp: '2024-01-10T08:10:00Z' },
    { id: 'hist-6', type: 'QR Generated', assetId: 'asset-3', assetCode: 'AC-003', assetName: 'CNC Machine X200', description: 'QR code generated for asset', timestamp: '2024-01-10T08:11:00Z' },
    { id: 'hist-7', type: 'Asset Created', assetId: 'asset-4', assetCode: 'AC-004', assetName: 'Conference Room Projector', description: 'Asset created and registered', timestamp: '2024-01-10T08:15:00Z' },
    { id: 'hist-8', type: 'QR Generated', assetId: 'asset-4', assetCode: 'AC-004', assetName: 'Conference Room Projector', description: 'QR code generated for asset', timestamp: '2024-01-10T08:16:00Z' },
    { id: 'hist-9', type: 'Asset Created', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Asset created and registered', timestamp: '2024-01-10T08:20:00Z' },
    { id: 'hist-10', type: 'QR Generated', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'QR code generated for asset', timestamp: '2024-01-10T08:21:00Z' },
    { id: 'hist-11', type: 'Issue Reported', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Issue reported: Forklift battery needs replacement', timestamp: '2024-01-08T16:00:00Z' },
    { id: 'hist-12', type: 'Status Changed', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Issue status changed from Pending to In Progress', timestamp: '2024-01-09T09:00:00Z' },
    { id: 'hist-13', type: 'Issue Reported', assetId: 'asset-2', assetCode: 'AC-002', assetName: 'HVAC Unit B3', description: 'Issue reported: HVAC not cooling properly', timestamp: '2024-01-12T10:30:00Z' },
    { id: 'hist-14', type: 'Status Changed', assetId: 'asset-2', assetCode: 'AC-002', assetName: 'HVAC Unit B3', description: 'Issue status changed from Pending to In Progress', timestamp: '2024-01-13T14:00:00Z' },
    { id: 'hist-15', type: 'Issue Reported', assetId: 'asset-1', assetCode: 'AC-001', assetName: 'Server Rack A1', description: 'Issue reported: Server 3 showing overheating warning', timestamp: '2024-01-14T09:15:00Z' },
    { id: 'hist-16', type: 'Status Changed', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Issue status changed from In Progress to Resolved', timestamp: '2024-01-11T11:30:00Z' },
    { id: 'hist-17', type: 'Maintenance Added', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Maintenance record added by Robert Chen', timestamp: '2024-01-11T11:30:00Z' },
    { id: 'hist-18', type: 'Issue Resolved', assetId: 'asset-5', assetCode: 'AC-005', assetName: 'Forklift FL-05', description: 'Issue resolved: Forklift battery needs replacement', timestamp: '2024-01-11T11:30:00Z' }
];

// ============================================
// Storage Helper Functions
// ============================================

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        return false;
    }
}

function loadData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return defaultValue;
    }
}

function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function getAssets() {
    return loadData(STORAGE_KEYS.ASSETS);
}

function saveAssets(assets) {
    return saveData(STORAGE_KEYS.ASSETS, assets);
}

function getIssues() {
    return loadData(STORAGE_KEYS.ISSUES);
}

function saveIssues(issues) {
    return saveData(STORAGE_KEYS.ISSUES, issues);
}

function getMaintenance() {
    return loadData(STORAGE_KEYS.MAINTENANCE);
}

function saveMaintenance(maintenance) {
    return saveData(STORAGE_KEYS.MAINTENANCE, maintenance);
}

function getHistory() {
    return loadData(STORAGE_KEYS.HISTORY);
}

function saveHistory(history) {
    return saveData(STORAGE_KEYS.HISTORY, history);
}

function addHistoryEntry(entry) {
    const history = getHistory();
    entry.id = entry.id || generateId();
    entry.timestamp = entry.timestamp || new Date().toISOString();
    history.unshift(entry);
    saveHistory(history);
    return entry;
}

function isAssetCodeExists(code) {
    const assets = getAssets();
    return assets.some(asset => asset.code.toLowerCase() === code.toLowerCase());
}

function getAssetById(id) {
    const assets = getAssets();
    return assets.find(asset => asset.id === id);
}

function getAssetByCode(code) {
    const assets = getAssets();
    return assets.find(asset => asset.code.toLowerCase() === code.toLowerCase());
}

function getIssuesByAssetId(assetId) {
    const issues = getIssues();
    return issues.filter(issue => issue.assetId === assetId);
}

function getMaintenanceByAssetId(assetId) {
    const maintenance = getMaintenance();
    return maintenance.filter(m => m.assetId === assetId);
}

function getHistoryByAssetId(assetId) {
    const history = getHistory();
    return history.filter(h => h.assetId === assetId);
}

// ============================================
// Initialize Demo Data
// ============================================

function initializeDemoData() {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
        saveAssets(DEMO_ASSETS);
        saveIssues(DEMO_ISSUES);
        saveMaintenance(DEMO_MAINTENANCE);
        saveHistory(DEMO_HISTORY);
        localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
        console.log('Demo data initialized successfully!');
        return true;
    }
    return false;
}

function resetDemoData() {
    localStorage.removeItem(STORAGE_KEYS.ASSETS);
    localStorage.removeItem(STORAGE_KEYS.ISSUES);
    localStorage.removeItem(STORAGE_KEYS.MAINTENANCE);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
    initializeDemoData();
    console.log('Demo data reset successfully!');
    return true;
}

// Auto-initialize on load
initializeDemoData();
