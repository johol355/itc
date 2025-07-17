// Interactive Checklist JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeChecklists();
});

function initializeChecklists() {
    const checklists = document.querySelectorAll('.interactive-checklist');
    
    checklists.forEach(checklist => {
        const checkboxes = checklist.querySelectorAll('.checklist-checkbox');
        const progressFill = checklist.querySelector('.progress-fill');
        const progressText = checklist.querySelector('.progress-text');
        const totalItems = checkboxes.length;
        
        // Add event listeners to checkboxes
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateProgress(checklist, checkboxes, progressFill, progressText, totalItems);
                saveChecklistState(checklist);
            });
        });
        
        // Load saved state
        loadChecklistState(checklist);
        
        // Initial progress update
        updateProgress(checklist, checkboxes, progressFill, progressText, totalItems);
    });
}

function updateProgress(checklist, checkboxes, progressFill, progressText, totalItems) {
    const checkedItems = Array.from(checkboxes).filter(cb => cb.checked).length;
    const percentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;
    
    progressFill.style.width = percentage + '%';
    progressText.textContent = `${checkedItems}/${totalItems} completed`;
    
    // Add completion animation
    if (checkedItems === totalItems && totalItems > 0) {
        checklist.classList.add('completed');
        setTimeout(() => {
            checklist.classList.remove('completed');
        }, 2000);
    }
}

function resetChecklist(checklistId) {
    const checklist = document.getElementById(checklistId);
    if (!checklist) return;
    
    const checkboxes = checklist.querySelectorAll('.checklist-checkbox');
    const progressFill = checklist.querySelector('.progress-fill');
    const progressText = checklist.querySelector('.progress-text');
    
    // Uncheck all checkboxes
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset progress
    progressFill.style.width = '0%';
    progressText.textContent = `0/${checkboxes.length} completed`;
    
    // Clear saved state
    clearChecklistState(checklist);
    
    // Add reset animation
    checklist.classList.add('reset');
    setTimeout(() => {
        checklist.classList.remove('reset');
    }, 300);
}

function saveChecklistState(checklist) {
    const checklistId = checklist.id;
    const checkboxes = checklist.querySelectorAll('.checklist-checkbox');
    const state = Array.from(checkboxes).map(cb => cb.checked);
    
    localStorage.setItem(`checklist-${checklistId}`, JSON.stringify(state));
}

function loadChecklistState(checklist) {
    const checklistId = checklist.id;
    const savedState = localStorage.getItem(`checklist-${checklistId}`);
    
    if (savedState) {
        const state = JSON.parse(savedState);
        const checkboxes = checklist.querySelectorAll('.checklist-checkbox');
        
        state.forEach((checked, index) => {
            if (checkboxes[index]) {
                checkboxes[index].checked = checked;
            }
        });
    }
}

function clearChecklistState(checklist) {
    const checklistId = checklist.id;
    localStorage.removeItem(`checklist-${checklistId}`);
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
    .interactive-checklist.completed {
        animation: checklistComplete 0.5s ease-in-out;
    }
    
    .interactive-checklist.reset {
        animation: checklistReset 0.3s ease-in-out;
    }
    
    @keyframes checklistComplete {
        0% { background: #fafafa; }
        50% { background: #e8f5e8; }
        100% { background: #fafafa; }
    }
    
    @keyframes checklistReset {
        0% { transform: scale(1); }
        50% { transform: scale(0.98); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);