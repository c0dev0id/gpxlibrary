/**
 * Modal Dialog System
 * Provides non-blocking modal dialogs for confirm, prompt, and info
 */

const Modal = (function() {
    'use strict';

    let modalContainer = null;
    let activeModal = null;
    let resolveCallback = null;

    /**
     * Initialize modal system
     */
    function init() {
        // Create modal container
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalContainer';
        modalContainer.className = 'modal-container';
        document.body.appendChild(modalContainer);
    }

    /**
     * Show a confirmation dialog
     * @param {string} message - The message to display
     * @param {string} title - Optional title (defaults to "Confirm")
     * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
     */
    function confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal-backdrop"></div>
                <div class="modal-dialog modal-confirm">
                    <div class="modal-header">
                        <h5 class="modal-title">${escapeHtml(title)}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${escapeHtml(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-cancel">Cancel</button>
                        <button class="btn btn-primary modal-confirm-btn">OK</button>
                    </div>
                </div>
            `;

            showModal(modalHtml, (result) => {
                resolve(result === true);
            });

            // Set up button handlers
            const cancelBtn = modalContainer.querySelector('.modal-cancel');
            const confirmBtn = modalContainer.querySelector('.modal-confirm-btn');

            cancelBtn.addEventListener('click', () => closeModal(false));
            confirmBtn.addEventListener('click', () => closeModal(true));

            // Focus confirm button
            confirmBtn.focus();

            // Enter key confirms, Escape cancels
            const keyHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    closeModal(true);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeModal(false);
                }
            };
            modalContainer.addEventListener('keydown', keyHandler);
        });
    }

    /**
     * Show a prompt dialog
     * @param {string} message - The message to display
     * @param {string} defaultValue - Default input value
     * @param {string} title - Optional title (defaults to "Input")
     * @returns {Promise<string|null>} - Resolves to input value if confirmed, null if cancelled
     */
    function prompt(message, defaultValue = '', title = 'Input') {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal-backdrop"></div>
                <div class="modal-dialog modal-prompt">
                    <div class="modal-header">
                        <h5 class="modal-title">${escapeHtml(title)}</h5>
                    </div>
                    <div class="modal-body">
                        <p>${escapeHtml(message)}</p>
                        <input type="text" class="form-control modal-input" value="${escapeHtml(defaultValue)}">
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary modal-cancel">Cancel</button>
                        <button class="btn btn-primary modal-confirm-btn">OK</button>
                    </div>
                </div>
            `;

            showModal(modalHtml, (result) => {
                resolve(result);
            });

            // Set up elements
            const input = modalContainer.querySelector('.modal-input');
            const cancelBtn = modalContainer.querySelector('.modal-cancel');
            const confirmBtn = modalContainer.querySelector('.modal-confirm-btn');

            // Select all text in input
            input.select();
            input.focus();

            // Button handlers
            cancelBtn.addEventListener('click', () => closeModal(null));
            confirmBtn.addEventListener('click', () => {
                const value = input.value.trim();
                closeModal(value || null);
            });

            // Enter key confirms, Escape cancels
            const keyHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const value = input.value.trim();
                    closeModal(value || null);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeModal(null);
                }
            };
            input.addEventListener('keydown', keyHandler);
        });
    }

    /**
     * Show an information modal
     * @param {string} title - Modal title
     * @param {string} content - HTML content to display
     */
    function show(title, content) {
        return new Promise((resolve) => {
            const modalHtml = `
                <div class="modal-backdrop"></div>
                <div class="modal-dialog modal-info">
                    <div class="modal-header">
                        <h5 class="modal-title">${escapeHtml(title)}</h5>
                        <button class="modal-close" aria-label="Close">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary modal-ok-btn">OK</button>
                    </div>
                </div>
            `;

            showModal(modalHtml, () => {
                resolve();
            });

            // Set up button handlers
            const closeBtn = modalContainer.querySelector('.modal-close');
            const okBtn = modalContainer.querySelector('.modal-ok-btn');

            closeBtn.addEventListener('click', () => closeModal());
            okBtn.addEventListener('click', () => closeModal());

            // Focus OK button
            okBtn.focus();

            // Enter or Escape closes
            const keyHandler = (e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    closeModal();
                }
            };
            modalContainer.addEventListener('keydown', keyHandler);
        });
    }

    /**
     * Show modal with HTML content
     */
    function showModal(html, callback) {
        // Close any existing modal
        if (activeModal) {
            closeModal(null, true);
        }

        modalContainer.innerHTML = html;
        activeModal = modalContainer.querySelector('.modal-dialog');
        const backdrop = modalContainer.querySelector('.modal-backdrop');
        resolveCallback = callback;

        // Backdrop click closes modal
        backdrop.addEventListener('click', () => closeModal(null));

        // Trigger animation
        setTimeout(() => {
            activeModal.classList.add('show');
            backdrop.classList.add('show');
        }, 10);
    }

    /**
     * Close active modal
     */
    function closeModal(result, skipCallback = false) {
        if (!activeModal) return;

        const backdrop = modalContainer.querySelector('.modal-backdrop');
        activeModal.classList.remove('show');
        if (backdrop) {
            backdrop.classList.remove('show');
        }

        setTimeout(() => {
            modalContainer.innerHTML = '';
            activeModal = null;

            if (!skipCallback && resolveCallback) {
                resolveCallback(result);
                resolveCallback = null;
            }
        }, 200); // Match CSS transition duration
    }

    /**
     * Helper to escape HTML
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init,
        confirm,
        prompt,
        show
    };
})();
