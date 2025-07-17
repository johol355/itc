#!/bin/bash

# Medical Guidelines Build Script
# Converts Quarto markdown files to PDFs and updates web app

echo "Building Medical Guidelines..."

# Check if Quarto is installed
if ! command -v quarto &> /dev/null; then
    echo "Error: Quarto is not installed. Please install Quarto first."
    echo "Visit: https://quarto.org/docs/get-started/"
    exit 1
fi

# Create output directories if they don't exist
mkdir -p pdfs
mkdir -p docs/guidelines

# Copy checklist assets
echo "Copying checklist assets..."
if [ -d "_extensions/checklist" ]; then
    # Copy checklist CSS and JS to docs for PWA
    cp -r _extensions/checklist/checklist.css docs/ 2>/dev/null || echo "Note: checklist.css not found"
    cp -r _extensions/checklist/checklist.js docs/ 2>/dev/null || echo "Note: checklist.js not found"
    
    # Copy to docs/guidelines for HTML output
    mkdir -p docs/guidelines/_extensions/checklist
    cp -r _extensions/checklist/* docs/guidelines/_extensions/checklist/ 2>/dev/null || echo "Note: checklist extension not found"
fi

# Convert Quarto files to PDFs and HTML
echo "Converting Quarto files to PDF and HTML..."
for file in guidelines/*.qmd; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .qmd)
        echo "Processing: $filename"
        
        # Render to PDF
        quarto render "$file" --to pdf --output-dir pdfs
        
        # Render to HTML for web app
        quarto render "$file" --to html --output-dir docs/guidelines
        
        echo "✓ Processed: $filename"
    fi
done

# Update web app with latest guidelines
echo "Updating web application..."
# Generate JSON index of guidelines for the web app
node scripts/generate-index.js 2>/dev/null || echo "Note: generate-index.js not found, skipping index generation"

echo "Build complete!"
echo "📄 PDFs generated in: pdfs/"
echo "🌐 HTML files generated in: docs/guidelines/"