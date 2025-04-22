// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const latestBlock = document.getElementById('latest-block');
const latestTxCount = document.getElementById('latest-tx-count');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');

// State
let currentBlockNumber = 0;
const UPDATE_INTERVAL = 3000; // 3 seconds

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestBlock();
    setupEventListeners();
    startLiveUpdates();
});

// Event Listeners
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchLatestBlock);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

// Live Updates
function startLiveUpdates() {
    setInterval(() => {
        fetchLatestBlock(true); // Silent update
    }, UPDATE_INTERVAL);
}

// Fetch Latest Block
async function fetchLatestBlock(silent = false) {
    try {
        if (!silent) {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Refreshing...';
        }

        const response = await fetch('/latestblock');
        if (!response.ok) throw new Error('Network error');
        
        const data = await response.json();
        if (data.latestBlock !== currentBlockNumber) {
            currentBlockNumber = data.latestBlock;
            updateBlockUI(data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        connectionStatus.textContent = '❌ Disconnected';
        if (!silent) showError('Connection issue. Retrying...');
    } finally {
        if (!silent) {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh';
        }
    }
}

// Update UI
function updateBlockUI(data) {
    latestBlock.textContent = `Block #${data.latestBlock}`;
    latestTxCount.textContent = `Transactions: ${data.transactions}`;
    connectionStatus.textContent = '✅ Connected';
}

// Handle Search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter an address or transaction hash');
        return;
    }

    try {
        showLoading();
        const response = await fetch(`/search/${query}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Search failed');
        }
        
        const data = await response.json();
        displayResults(data);
        errorMessage.style.display = 'none';
    } catch (error) {
        showError(error.message);
        resultsContainer.innerHTML = '';
    }
}

// Display Results
function displayResults(data) {
    resultsContainer.innerHTML = '';

    if (Array.isArray(data.transaction)) {
        // Address results
        const heading = document.createElement('h2');
        heading.textContent = `Transactions for: ${searchInput.value}`;
        resultsContainer.appendChild(heading);

        if (data.transaction.length === 0) {
            resultsContainer.innerHTML += '<p>No transactions found</p>';
            return;
        }

        data.transaction.forEach(tx => {
            resultsContainer.appendChild(createTxElement(tx));
        });
    } else {
        // Single transaction
        resultsContainer.appendChild(createTxElement(data.transaction, data.block));
    }
}

// Create Transaction Element
function createTxElement(tx, block = null) {
    const element = document.createElement('div');
    element.className = 'transaction';
    
    element.innerHTML = `
        <p><strong>Hash:</strong> ${tx.hash}</p>
        <p><strong>From:</strong> ${tx.from}</p>
        <p><strong>To:</strong> ${tx.to || 'Contract Creation'}</p>
        <p><strong>Value:</strong> ${ethers.formatEther(tx.value)} MONAD</p>
        ${block ? `<p><strong>Block:</strong> ${block.number} (${new Date(block.timestamp * 1000).toLocaleString()})</p>` : ''}
    `;
    
    return element;
}

// Helpers
function showLoading() {
    resultsContainer.innerHTML = '<p>Loading...</p>';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}