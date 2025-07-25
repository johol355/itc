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
        
        # Render to HTML first (this always works)
        quarto render "$file" --to html --output-dir docs/guidelines
        
        # Quarto sometimes creates nested directories, so move files to correct location
        if [ -f "guidelines/docs/guidelines/$filename.html" ]; then
            mv "guidelines/docs/guidelines/$filename.html" "docs/guidelines/"
            rm -rf "guidelines/docs"
        fi
        
        # Try to render to PDF (with fallback)
        if quarto render "$file" --to pdf --output-dir pdfs 2>/dev/null; then
            echo "✓ PDF generated: $filename"
        else
            echo "⚠ PDF generation failed for: $filename (HTML still available)"
            # Create a placeholder PDF notice
            echo "PDF generation failed. Please use the HTML version for interactive features." > "pdfs/$filename.txt"
        fi
        
        echo "✓ Processed: $filename"
    fi
done

# Update web app with latest guidelines
echo "Updating web application..."
# Install dependencies if needed
if ! npm list js-yaml >/dev/null 2>&1; then
    echo "Installing js-yaml..."
    npm install js-yaml
fi
# Generate JSON index of guidelines for the web app
node scripts/generate-index.js

# Copy PDF files to guidelines folder for web access
echo "Copying PDF guidelines..."
if [ -d "pdfs" ]; then
    # Copy external PDF guidelines to web directory
    for pdf in pdfs/*.pdf; do
        if [ -f "$pdf" ]; then
            cp "$pdf" "docs/guidelines/"
            echo "✓ Copied: $(basename "$pdf")"
        fi
    done
fi

# Update cache version to force cache refresh
echo "Updating cache version..."
node scripts/update-cache-version.js

echo "Build complete!"
echo "📄 PDFs generated in: pdfs/"
echo "🌐 HTML files generated in: docs/guidelines/"