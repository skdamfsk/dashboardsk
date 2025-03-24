export const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

export const showAlert = (message, type = 'success') => {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-2`;
    alertDiv.textContent = message;

    alertContainer.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
};

export const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
};

export const initializeChart = (ctx, type, data, options) => {
    return new Chart(ctx, { type, data, options });
};
