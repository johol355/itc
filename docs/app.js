// Medical Guidelines PWA
class MedicalGuidelinesApp {
    constructor() {
        this.guidelines = [];
        this.init();
    }
    
    init() {
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
        
        // Load guidelines
        this.loadGuidelines();
        
        // Setup navigation
        this.setupNavigation();
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
                url: `guidelines/${guideline.html}`,
                pdfUrl: `${guideline.pdf}`
            }));
        } catch (error) {
            console.warn('Could not load guidelines index, using fallback');
            // Fallback to sample data
            this.guidelines = [
                {
                    id: "sample-guideline",
                    title: "Sample Medical Guideline",
                    description: "Example guideline for demonstration",
                    url: "guidelines/sample-guideline.html",
                    pdfUrl: "pdfs/sample-guideline.pdf"
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
                    <a href="${guideline.url}" class="button">View Online</a>
                    <a href="${guideline.pdfUrl}" class="button secondary" target="_blank">Download PDF</a>
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MedicalGuidelinesApp();
});