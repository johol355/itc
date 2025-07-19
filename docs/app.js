// Medical Guidelines PWA
class MedicalGuidelinesApp {
    constructor() {
        this.guidelines = [];
        this.loadProgress = 0;
        this.loadSteps = [
            { progress: 10, message: "Initializing application..." },
            { progress: 30, message: "Registering service worker..." },
            { progress: 50, message: "Loading guidelines index..." },
            { progress: 70, message: "Caching guidelines for offline access..." },
            { progress: 90, message: "Preparing interface..." },
            { progress: 100, message: "Ready!" }
        ];
        this.currentStep = 0;
        this.init();
    }
    
    async init() {
        // Initialize dark mode
        this.initDarkMode();
        
        // Start load sequence
        this.updateLoadProgress();
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            this.updateLoadProgress(); // Step 2
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered:', registration);
                
                // Listen for content updates and caching progress
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data.type === 'CONTENT_UPDATED') {
                        console.log('Content updated, refreshing guidelines...');
                        this.loadGuidelines(); // Silently reload guidelines
                    } else if (event.data.type === 'CACHE_COMPLETE') {
                        this.updateLoadProgress(); // Step 4 - Caching complete
                    }
                });
                
                // Listen for service worker installation progress
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', () => {
                        if (registration.installing.state === 'installed') {
                            // Fallback in case message doesn't arrive
                            setTimeout(() => this.updateLoadProgress(), 1000);
                        }
                    });
                }
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
        
        // Load guidelines
        this.updateLoadProgress(); // Step 3
        await this.loadGuidelines();
        
        // Setup search
        this.setupSearch();
        
        // Final steps
        this.updateLoadProgress(); // Step 5
        await this.delay(500); // Brief pause for UX
        this.updateLoadProgress(); // Step 6 - Complete
        
        // Hide load screen and show app
        await this.delay(300);
        this.hideLoadScreen();
    }
    
    updateLoadProgress() {
        if (this.currentStep < this.loadSteps.length) {
            const step = this.loadSteps[this.currentStep];
            const progressBar = document.getElementById('load-progress');
            const progressPercent = document.getElementById('load-percentage');
            const statusMessage = document.getElementById('load-status');
            
            if (progressBar) progressBar.style.width = step.progress + '%';
            if (progressPercent) progressPercent.textContent = step.progress + '%';
            if (statusMessage) statusMessage.textContent = step.message;
            
            this.currentStep++;
        }
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    hideLoadScreen() {
        const loadScreen = document.getElementById('load-screen');
        const app = document.getElementById('app');
        
        if (loadScreen) {
            loadScreen.style.opacity = '0';
            loadScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loadScreen.style.display = 'none';
            }, 500);
        }
        
        if (app) {
            app.classList.remove('app-hidden');
            app.style.opacity = '0';
            app.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                app.style.opacity = '1';
            }, 100);
        }
    }
    
    initDarkMode() {
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const savedTheme = localStorage.getItem('theme') || 'light';
        
        // Apply saved theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Update button text
                darkModeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
            
            // Set initial button text
            darkModeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }
    
    async loadGuidelines() {
        try {
            // Load guidelines from generated index with cache busting
            const timestamp = Date.now();
            const response = await fetch(`guidelines/index.json?v=${timestamp}`);
            const data = await response.json();
            
            // Check if we have a newer version
            const lastVersion = localStorage.getItem('lastGuidelinesVersion');
            const currentVersion = data.generated;
            
            if (lastVersion && lastVersion !== currentVersion) {
                console.log('New guidelines version detected:', currentVersion);
                // Clear old content cache to ensure fresh content
                this.guidelines.forEach(g => g.htmlContent = null);
            }
            
            // Store current version
            localStorage.setItem('lastGuidelinesVersion', currentVersion);
            
            this.guidelines = data.guidelines.map(guideline => ({
                id: guideline.id,
                type: guideline.type || 'qmd',
                title: guideline.title,
                description: guideline.description || `Medical guideline: ${guideline.title}`,
                keywords: guideline.keywords || [],
                source: guideline.source,
                category: guideline.category,
                pdf: guideline.pdf,
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
                ${guideline.source ? `<p class="guideline-source">Source: ${guideline.source}</p>` : ''}
                <div class="guideline-actions">
                    <button class="button" onclick="window.medicalApp.openGuideline('${guideline.id}')">
                        ${guideline.type === 'pdf' ? 'Open PDF' : 'Open Guideline'}
                    </button>
                </div>
                <div class="offline-status">
                    <span class="status-indicator">✓ Available offline</span>
                    ${guideline.type === 'pdf' ? '<span class="type-indicator">PDF</span>' : ''}
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
        const searchLower = searchTerm.toLowerCase();
        const filteredGuidelines = this.guidelines.filter(guideline => 
            guideline.title.toLowerCase().includes(searchLower) ||
            guideline.description.toLowerCase().includes(searchLower) ||
            (guideline.keywords && guideline.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchLower)
            ))
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
                ${guideline.source ? `<p class="guideline-source">Source: ${guideline.source}</p>` : ''}
                <div class="guideline-actions">
                    <button class="button" onclick="window.medicalApp.openGuideline('${guideline.id}')">
                        ${guideline.type === 'pdf' ? 'Open PDF' : 'Open Guideline'}
                    </button>
                </div>
                <div class="offline-status">
                    <span class="status-indicator">✓ Available offline</span>
                    ${guideline.type === 'pdf' ? '<span class="type-indicator">PDF</span>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    async openGuideline(guidelineId) {
        const guideline = this.guidelines.find(g => g.id === guidelineId);
        if (!guideline) return;
        
        if (guideline.type === 'pdf') {
            // Show PDF viewer for external PDF guidelines
            this.showPDFViewer(guideline);
            return;
        }
        
        // EMERGENCY READY: Try to load QMD content immediately without loading state
        try {
            // Load guideline content if not already loaded
            if (!guideline.htmlContent) {
                // Try cache first for instant access, but check for updates
                const timestamp = Date.now();
                const response = await fetch(`guidelines/${guidelineId}.html?v=${timestamp}`);
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
    
    showPDFViewer(guideline) {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = `
            <div class="guideline-viewer">
                <div class="guideline-header">
                    <button class="button secondary" onclick="window.medicalApp.showGuidelinesList()">← Back to Guidelines</button>
                    <h2>${guideline.title}</h2>
                    ${guideline.source ? `<p class="guideline-source">Source: ${guideline.source}</p>` : ''}
                </div>
                <div class="pdf-viewer-container">
                    <iframe src="simple-pdf-viewer.html?file=guidelines/${guideline.pdf}" 
                            width="100%" height="800px" style="border: none; border-radius: 8px;">
                        <p>Your browser doesn't support PDF viewing. 
                           <a href="guidelines/${guideline.pdf}" target="_blank">Download PDF</a>
                        </p>
                    </iframe>
                </div>
            </div>
        `;
        
        // Hide search bar when viewing PDF
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.display = 'none';
        }
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
                    <h2>${title}</h2>
                </div>
                <div class="error">
                    <p>Unable to load this guideline.</p>
                    <button class="button" onclick="window.medicalApp.openGuideline('${guidelineId}')">Try Again</button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medicalApp = new MedicalGuidelinesApp();
});