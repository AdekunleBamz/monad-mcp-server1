document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const connectionStatus = document.getElementById('connection-status');
    const latestBlock = document.getElementById('latest-block');
    const latestTxCount = document.getElementById('latest-tx-count');
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const errorMessage = document.getElementById('error-message');
    const resultsContainer = document.getElementById('results-container');

    // Initial load
    fetchLatestBlock();
    setupEventListeners();

    // Set up event listeners
    function setupEventListeners() {
        refreshBtn.addEventListener('click', fetchLatestBlock);
        searchBtn.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
    }

    // Fetch latest block info
    async function fetchLatestBlock() {
        try {
            refreshBtn.disabled = true;
            refreshBtn.textContent = 'Refreshing...';
            
            const response = await fetch('/latestblock');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            latestBlock.textContent = `Block #${data.latestBlock}`;
            latestTxCount.textContent = `Transactions: ${data.transactions}`;
            connectionStatus.textContent = '✅ Connected';
        } catch (error) {
            console.error('Error fetching latest block:', error);
            connectionStatus.textContent = '❌ Disconnected';
            showError('Failed to fetch latest block data. Please try again.');
        } finally {
            refreshBtn.disabled = false;
            refreshBtn.textContent = 'Refresh';
        }
    }

    // Handle search
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
                const errorData = await response.json();
                throw new Error(errorData.message || 'Search failed');
            }
            
            const data = await response.json();
            displayResults(data);
            errorMessage.style.display = 'none';
        } catch (error) {
            console.error('Search error:', error);
            showError(error.message || 'An error occurred during search');
            resultsContainer.innerHTML = '';
        }
    }

    // Display search results
    function displayResults(data) {
        resultsContainer.innerHTML = '';

        if (Array.isArray(data.transaction)) {
            // Address search results (array of transactions)
            const heading = document.createElement('h2');
            heading.textContent = `Transactions for address: ${searchInput.value}`;
            resultsContainer.appendChild(heading);

            if (data.transaction.length === 0) {
                const noResults = document.createElement('p');
                noResults.textContent = 'No transactions found for this address';
                resultsContainer.appendChild(noResults);
                return;
            }

            data.transaction.forEach(tx => {
                const txElement = createTransactionElement(tx);
                resultsContainer.appendChild(txElement);
            });
        } else {
            // Single transaction result
            const heading = document.createElement('h2');
            heading.textContent = `Transaction Details`;
            resultsContainer.appendChild(heading);

            const txElement = createTransactionElement(data.transaction, data.block);
            resultsContainer.appendChild(txElement);
        }
    }

    // Create transaction element
    function createTransactionElement(tx, block = null) {
        const txElement = document.createElement('div');
        txElement.className = 'transaction';

        const txHash = document.createElement('p');
        txHash.innerHTML = `<strong>Hash:</strong> ${tx.hash}`;
        txElement.appendChild(txHash);

        const fromTo = document.createElement('p');
        fromTo.innerHTML = `<strong>From:</strong> ${tx.from} <br> <strong>To:</strong> ${tx.to || 'Contract Creation'}`;
        txElement.appendChild(fromTo);

        const value = document.createElement('p');
        value.innerHTML = `<strong>Value:</strong> ${ethers.formatEther(tx.value)} MONAD`;
        txElement.appendChild(value);

        if (block) {
            const blockInfo = document.createElement('p');
            blockInfo.innerHTML = `<strong>Block:</strong> ${block.number} (${new Date(block.timestamp * 1000).toLocaleString()})`;
            txElement.appendChild(blockInfo);
        }

        const viewDetails = document.createElement('a');
        viewDetails.href = `#${tx.hash}`;
        viewDetails.textContent = 'View Details';
        viewDetails.style.marginLeft = '10px';
        viewDetails.style.color = '#6200ea';
        txElement.appendChild(viewDetails);

        return txElement;
    }

    // Show loading state
    function showLoading() {
        resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    }

    // Show error message
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
});