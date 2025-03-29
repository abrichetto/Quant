// Trading functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize trading manager with API credentials
    // Note: In production, these should be stored securely and not hardcoded
    const apiKey = localStorage.getItem('bigone_api_key');
    const apiSecret = localStorage.getItem('bigone_api_secret');
    
    if (apiKey && apiSecret) {
        tradingManager.initialize(apiKey, apiSecret);
        updateAccountOverview();
    }

    // Handle order type change
    const orderTypeSelect = document.getElementById('order-type');
    const limitPriceRow = document.getElementById('limit-price-row');
    
    orderTypeSelect.addEventListener('change', function() {
        limitPriceRow.style.display = this.value === 'LIMIT' ? 'block' : 'none';
    });

    // Handle order placement
    const placeOrderBtn = document.getElementById('place-order-btn');
    placeOrderBtn.addEventListener('click', async function() {
        if (!tradingManager.isAuthenticated) {
            alert('Please configure your API credentials first');
            return;
        }

        const symbol = document.getElementById('trading-symbol').value;
        const orderType = document.getElementById('order-type').value;
        const side = document.getElementById('order-side').value;
        const amount = document.getElementById('order-amount').value;
        const price = document.getElementById('order-price').value;

        if (!amount || (orderType === 'LIMIT' && !price)) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            if (orderType === 'LIMIT') {
                await tradingManager.placeOrder(symbol, side, price, amount);
            } else {
                await tradingManager.placeMarketOrder(symbol, side, amount);
            }
            alert('Order placed successfully!');
            updateAccountOverview();
        } catch (error) {
            alert('Failed to place order: ' + error.message);
        }
    });

    // Update account overview periodically
    setInterval(updateAccountOverview, 30000); // Update every 30 seconds
});

async function updateAccountOverview() {
    if (!tradingManager.isAuthenticated) return;

    try {
        const accountInfo = await tradingManager.getAccountBalance();
        const totalBalance = accountInfo.total_balance;
        const availableBalance = accountInfo.available_balance;
        const openPositions = accountInfo.open_positions;

        document.getElementById('total-balance').textContent = `$${totalBalance.toFixed(2)}`;
        document.getElementById('available-balance').textContent = `$${availableBalance.toFixed(2)}`;
        document.getElementById('open-positions').textContent = openPositions.length;
    } catch (error) {
        console.error('Failed to update account overview:', error);
    }
} 