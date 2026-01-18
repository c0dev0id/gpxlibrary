/**
 * Toast Notification System
 * Provides non-blocking notifications that fade in/out
 */

const Toast = (function() {
    'use strict';

    let container = null;

    /**
     * Initialize toast container
     */
    function init() {
        container = document.getElementById('toastContainer');
        if (!container) {
            console.error('Toast container not found');
        }
    }

    /**
     * Get icon for toast type
     */
    function getIcon(type) {
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            error: '<i class="bi bi-x-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>'
        };
        return icons[type] || icons.info;
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
     * @param {number} duration - How long to show the toast (ms), 0 for permanent
     */
    function show(message, type = 'info', duration = 4000) {
        if (!container) {
            console.error('Toast not initialized');
            return;
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${getIcon(type)}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
            <button class="toast-close" aria-label="Close">
                <i class="bi bi-x"></i>
            </button>
        `;

        // Add to container
        container.appendChild(toast);

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => hideToast(toast));

        // Auto-hide after duration (if not permanent)
        if (duration > 0) {
            setTimeout(() => hideToast(toast), duration);
        }

        return toast;
    }

    /**
     * Hide a specific toast
     */
    function hideToast(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300); // Match animation duration
    }

    /**
     * Helper to escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Convenience methods
     */
    function success(message, duration = 4000) {
        return show(message, 'success', duration);
    }

    function error(message, duration = 6000) {
        return show(message, 'error', duration);
    }

    function warning(message, duration = 5000) {
        return show(message, 'warning', duration);
    }

    function info(message, duration = 4000) {
        return show(message, 'info', duration);
    }

    /**
     * Clear all toasts
     */
    function clearAll() {
        if (!container) return;
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    return {
        init,
        show,
        success,
        error,
        warning,
        info,
        clearAll
    };
})();
