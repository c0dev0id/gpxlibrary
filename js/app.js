/**
 * Main Application
 * GPX Library - Motorcycle Route Manager
 */

(function() {
    'use strict';
    
    /**
     * Initialize application
     */
    async function init() {
        try {
            // Show loading
            UIController.showLoadingSpinner();
            
            // Initialize database
            console.log('Initializing database...');
            await Database.init();
            
            // Initialize map
            console.log('Initializing map...');
            MapPreview.init();
            
            // Initialize UI
            console.log('Initializing UI...');
            UIController.init();
            
            // Render initial file list
            UIController.renderFileList();
            
            // Hide loading
            UIController.hideLoadingSpinner();
            
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Application initialization failed:', error);
            alert('Failed to initialize application: ' + error.message);
            UIController.hideLoadingSpinner();
        }
    }
    
    // Initialize when DOM is ready
    $(document).ready(init);
    
})();
