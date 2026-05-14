// supa lit home.js file

// Sync button for CVEs from database:
document.getElementById('sync-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sync-btn');
    btn.textContent = 'Syncing...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/sync');
        const result = await response.json();
        btn.textContent = 'Sync NVD';
        btn.disabled = false;
        alert(result.message);
    } catch (err) {
        btn.textContent = 'Sync NVD';
        btn.disabled = false;
        alert('Sync failed. Try again.');
    }
});

// Load the four summary cards:
async function loadSummary() {
    // fetch info:
    const response = await fetch('/api/summary');
    const summary = await response.json();

    // change text content of the elements:
    document.getElementById('sev-critical').textContent = summary.critical;
    document.getElementById('sev-high').textContent = summary.high;
    document.getElementById('sev-medium').textContent = summary.medium;
    document.getElementById('sev-low').textContent = summary.low;
}

// Load the two visuals:
async function summaryVisuals () {
    // Grab chart elements:
    const vectorChart = document.getElementById('attack-vectors');

    const sevDistribution = document.getElementById('severity-distribution');

    // Check if the charts exist (so, checks if ur on home page):
    if (!vectorChart || !sevDistribution) {
        console.warn('Chart elements not found');
        return;
    }

    // Fetch both desired endpoints and do Promise.all so that it works simultaneously:
    try {
        const [summaryRes, vectorRes] = await Promise.all([
            fetch('/api/summary'),
            fetch('/api/attack-vectors')
        ]);

        const [summaryData, vectorData] = await Promise.all([
            summaryRes.json(),
            vectorRes.json()
        ]);

        // Make the charts with the data and such: 
        severityDistribution = new Chart (sevDistribution,{
            type: 'doughnut',
            data: {
                labels: [
                    'Critical',
                    'High',
                    'Medium',
                    'Low'
                ],
                datasets: [{
                    data: [summaryData.critical, summaryData.high, summaryData.medium, summaryData.low],
                    backgroundColor: [
                        '#e05c5c',
                        '#e8820c',
                        '#e0c060',
                        '#5ec875'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
            }
        });

        vectorDistribution = new Chart(vectorChart, {
            type: 'bar',
            data: {
                labels: Object.keys(vectorData),
                datasets: [{
                    label: 'CVE Count',
                    data: Object.values(vectorData),
                    backgroundColor: '#378ADD',
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
            }
        });
    } catch (err) {
        console.error("Stock fetch error:", err);
    }
}


// annoying ass CVE feed stuff w/ pagination:
// ==========================================
// Global variables:
let currentPage = 1;
const itemsPerPage = 25;
let allCves = [];
let sortColumn = null;
let sortDirection = 'asc';

// Fetches all CVEs in DB considering parameters and populates it to allCves list, then runs the loadTable() function:
async function loadCves(keyword = '', severity = 'all', days = '30') {
    const response = await fetch(`/api/cves?keyword=${keyword}&severity=${severity}&days=${days}`);
    allCves = await response.json();
    currentPage = 1;
    loadTable();
}

// Search button functionality:
document.getElementById('search-btn').addEventListener('click', () => {
    const keyword = document.getElementById('keyword-input').value;
    const severity = document.getElementById('severity-filter').value;
    const days = document.getElementById('date-filter').value;
    loadCves(keyword, severity, days);
});

// pmo pmo pmo (load the table function):
function loadTable () {
    // Uses the global page tracking variables to grab the current range of CVEs within the pagination:
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const page = allCves.slice(start, end);

    // Clear table since ur doing a new page, and then append new range to the feed:
    const tableBody = document.getElementById('cve-body');
    tableBody.innerHTML = '';
    page.forEach(cve => {
        tableBody.innerHTML += `
            <tr style="cursor: pointer;" onclick="window.location.href='cve-detail.html?id=${cve.id}'">
                <td>${cve.id}</td>
                <td>${cve.published}</td>
                <td>${cve.last_modified}</td>
                <td>${cve.severity || 'N/A'}</td>
                <td>${cve.base_score || 'N/A'}</td>
            </tr>
        `;
    });

    // Update da page indicator reflecting new changes and such:
    const totalPages = Math.ceil(allCves.length / itemsPerPage);
    document.getElementById('page-indicator').textContent = `Page ${currentPage} of ${totalPages}`;
}

// Event listeners for clicking the next/prev buttons:
document.getElementById('next-btn').addEventListener('click', () => {
    const totalPages = Math.ceil(allCves.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        loadTable();
    }
});

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadTable();
    }
});

window.onload = function() {
    summaryVisuals();
    loadSummary();
    loadCves('', 'all', 'all');
};