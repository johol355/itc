#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Read all .qmd files and extract metadata
function extractMetadata(qmdPath) {
    try {
        const content = fs.readFileSync(qmdPath, 'utf8');
        
        // Extract YAML frontmatter
        const yamlMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!yamlMatch) {
            return null;
        }
        
        const frontmatter = yaml.load(yamlMatch[1]);
        const filename = path.basename(qmdPath, '.qmd');
        
        return {
            id: filename,
            title: frontmatter.title || filename,
            description: frontmatter.description || `Medical guideline: ${frontmatter.title || filename}`,
            author: frontmatter.author,
            date: frontmatter.date,
            version: frontmatter.version,
            status: frontmatter.status,
            keywords: frontmatter.keywords || [],
            html: `${filename}.html`,
            pdf: `${filename}.pdf`
        };
    } catch (error) {
        console.error(`Error processing ${qmdPath}:`, error.message);
        return null;
    }
}

// Generate index.json for web app
function generateIndex() {
    const guidelinesDir = path.join(__dirname, '../guidelines');
    const outputDir = path.join(__dirname, '../docs/guidelines');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read all .qmd files
    const qmdFiles = fs.readdirSync(guidelinesDir)
        .filter(file => file.endsWith('.qmd'))
        .map(file => path.join(guidelinesDir, file));
    
    // Extract metadata from each file
    const guidelines = qmdFiles
        .map(extractMetadata)
        .filter(Boolean); // Remove null entries
    
    // Create index object
    const index = {
        generated: new Date().toISOString(),
        count: guidelines.length,
        guidelines: guidelines
    };
    
    // Write index.json
    const indexPath = path.join(outputDir, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
    
    console.log(`Generated index with ${guidelines.length} guidelines`);
    console.log(`Index saved to: ${indexPath}`);
    
    return index;
}

// Check if js-yaml is available
try {
    require.resolve('js-yaml');
} catch (e) {
    console.error('js-yaml package not found. Installing...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install js-yaml', { stdio: 'inherit' });
        console.log('js-yaml installed successfully');
    } catch (installError) {
        console.error('Failed to install js-yaml. Please run: npm install js-yaml');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateIndex();
}

module.exports = { generateIndex, extractMetadata };