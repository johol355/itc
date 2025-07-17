// Medical Guidelines PWA
class MedicalGuidelinesApp {
    constructor() {
        this.guidelines = [];
        this.init();
    }
    
    init() {
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').then((registration) => {
                console.log('Service Worker registered:', registration);
            }).catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
        }
        
        // Setup offline detection
        this.setupOfflineDetection();
        
        // Load guidelines
        this.loadGuidelines();
        
        // Setup search
        this.setupSearch();
    }
    
    setupOfflineDetection() {
        const offlineIndicator = document.getElementById('offline-indicator');
        
        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineIndicator.classList.remove('show');
            } else {
                offlineIndicator.classList.add('show');
            }
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Initial check
        updateOnlineStatus();
    }
    
    async loadGuidelines() {
        try {
            // Load guidelines from generated index
            const response = await fetch('guidelines/index.json');
            const data = await response.json();
            
            this.guidelines = data.guidelines.map(guideline => ({
                id: guideline.id,
                title: guideline.title,
                description: `Medical guideline: ${guideline.title}`,
                htmlContent: null // Will be loaded on demand
            }));
        } catch (error) {
            console.warn('Could not load guidelines index, using fallback');
            // Fallback to sample data
            this.guidelines = [
                {
                    id: "sample-guideline",
                    title: "Sample Medical Guideline",
                    description: "Example guideline for demonstration",
                    htmlContent: null
                }
            ];
        }
        
        this.renderGuidelines();
    }
    
    renderGuidelines() {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = this.guidelines.map(guideline => `
            <div class="guideline-card">
                <h3>${guideline.title}</h3>
                <p>${guideline.description}</p>
                <div class="guideline-actions">
                    <button class="button" onclick="window.medicalApp.openGuideline('${guideline.id}')">Open Guideline</button>
                </div>
            </div>
        `).join('');
    }
    
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterGuidelines(e.target.value);
            });
        }
    }
    
    filterGuidelines(searchTerm) {
        const filteredGuidelines = this.guidelines.filter(guideline => 
            guideline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            guideline.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderFilteredGuidelines(filteredGuidelines);
    }
    
    renderFilteredGuidelines(guidelines) {
        const container = document.getElementById('guidelines-list');
        if (guidelines.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <p>No guidelines found matching your search.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = guidelines.map(guideline => `
            <div class="guideline-card">
                <h3>${guideline.title}</h3>
                <p>${guideline.description}</p>
                <div class="guideline-actions">
                    <button class="button" onclick="window.medicalApp.openGuideline('${guideline.id}')">Open Guideline</button>
                </div>
            </div>
        `).join('');
    }
    
    async openGuideline(guidelineId) {
        const guideline = this.guidelines.find(g => g.id === guidelineId);
        if (!guideline) return;
        
        // EMERGENCY READY: Try to load content immediately without loading state
        try {
            // Load guideline content if not already loaded
            if (!guideline.htmlContent) {
                // Try cache first for instant access
                const response = await fetch(`guidelines/${guidelineId}.html`);
                if (response.ok) {
                    let html = await response.text();
                    
                    // Extract just the main content (remove html/head/body tags)
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const mainContent = doc.querySelector('main') || doc.querySelector('body');
                    
                    guideline.htmlContent = mainContent ? mainContent.innerHTML : html;
                } else {
                    throw new Error('Failed to load guideline');
                }
            }
            
            // Display the guideline immediately
            this.showGuidelineContent(guideline);
            
        } catch (error) {
            console.error('Error loading guideline:', error);
            // Show error immediately without loading state delays
            this.showGuidelineError(guideline.title, guidelineId);
        }
    }
    
    showGuidelineLoading(title) {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = `
            <div class="guideline-viewer">
                <div class="guideline-header">
                    <button class="button secondary" onclick="window.medicalApp.showSection('guidelines')">← Back to Guidelines</button>
                    <h2>${title}</h2>
                </div>
                <div class="loading">Loading guideline...</div>
            </div>
        `;
    }
    
    showGuidelineContent(guideline) {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = `
            <div class="guideline-viewer">
                <div class="guideline-header">
                    <button class="button secondary" onclick="window.medicalApp.showGuidelinesList()">← Back to Guidelines</button>
                    <h2>${guideline.title}</h2>
                </div>
                <div class="guideline-content">
                    ${guideline.htmlContent}
                </div>
            </div>
        `;
        
        // Hide search bar when viewing guideline
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }
        
        // Initialize checklists after content is loaded
        setTimeout(() => {
            if (window.initializeChecklists) {
                window.initializeChecklists();
            }
        }, 100);
    }
    
    showGuidelinesList() {
        // Show search bar
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.display = 'block';
        }
        
        // Clear search and show all guidelines
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.renderGuidelines();
    }
    
    showGuidelineError(title, guidelineId) {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = `
            <div class="guideline-viewer">
                <div class="guideline-header">
                    <button class="button secondary" onclick="window.medicalApp.showGuidelinesList()">← Back to Guidelines</button>
                    <h2>⚠️ ${title}</h2>
                </div>
                <div class="emergency-error">
                    <div class="error-content">
                        <h3>Emergency Access Issue</h3>
                        <p><strong>This guideline is not available offline.</strong></p>
                        <p>To ensure emergency access:</p>
                        <ul>
                            <li>Connect to WiFi/cellular network</li>
                            <li>Open this guideline once to cache it</li>
                            <li>It will then be available offline</li>
                        </ul>
                        <div class="error-actions">
                            ${navigator.onLine ? 
                                `<button class="button" onclick="window.medicalApp.openGuideline('${guidelineId}')">🔄 Try Again</button>` :
                                `<button class="button offline" disabled>📶 Connect to Internet First</button>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medicalApp = new MedicalGuidelinesApp();
});