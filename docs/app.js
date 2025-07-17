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
        
        // Setup navigation
        this.setupNavigation();
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
    
    setupNavigation() {
        // Simple SPA navigation
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });
    }
    
    showSection(sectionId) {
        document.querySelectorAll('main section').forEach(section => {
            section.style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
    }
    
    async openGuideline(guidelineId) {
        const guideline = this.guidelines.find(g => g.id === guidelineId);
        if (!guideline) return;
        
        // Show loading state
        this.showGuidelineLoading(guideline.title);
        
        try {
            // Load guideline content if not already loaded
            if (!guideline.htmlContent) {
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
            
            // Display the guideline
            this.showGuidelineContent(guideline);
            
        } catch (error) {
            console.error('Error loading guideline:', error);
            this.showGuidelineError(guideline.title);
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
                    <button class="button secondary" onclick="window.medicalApp.showSection('guidelines')">← Back to Guidelines</button>
                    <h2>${guideline.title}</h2>
                </div>
                <div class="guideline-content">
                    ${guideline.htmlContent}
                </div>
            </div>
        `;
        
        // Initialize checklists after content is loaded
        setTimeout(() => {
            if (window.initializeChecklists) {
                window.initializeChecklists();
            }
        }, 100);
    }
    
    showGuidelineError(title) {
        const container = document.getElementById('guidelines-list');
        container.innerHTML = `
            <div class="guideline-viewer">
                <div class="guideline-header">
                    <button class="button secondary" onclick="window.medicalApp.showSection('guidelines')">← Back to Guidelines</button>
                    <h2>${title}</h2>
                </div>
                <div class="error">
                    <p>Unable to load this guideline. Please check your connection and try again.</p>
                    <button class="button" onclick="window.medicalApp.openGuideline('${title}')">Retry</button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.medicalApp = new MedicalGuidelinesApp();
});