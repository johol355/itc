# Medical Guidelines Project

A comprehensive system for managing medical guidelines with automated PDF generation and a Progressive Web App (PWA) for easy access.

## Project Structure

```
├── guidelines/          # Quarto markdown (.qmd) source files for medical guidelines
├── pdfs/               # Generated PDF versions of guidelines
├── docs/               # GitHub Pages PWA for web access
├── scripts/            # Automation scripts for building and deployment
└── environment.yml     # Conda environment configuration
```

## Setup Instructions

### Prerequisites

- [Conda](https://conda.io/projects/conda/en/latest/user-guide/install/index.html) (Anaconda or Miniconda)
- [Quarto](https://quarto.org/docs/get-started/) (for rendering .qmd files to PDF and HTML)
- [Claude Code](https://claude.ai/code) (for AI-assisted development)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd itc
   ```

2. **Create and activate conda environment:**
   ```bash
   conda env create -f environment.yml
   conda activate itc
   ```

3. **Install Quarto:**
   ```bash
   # Install Quarto (visit https://quarto.org/docs/get-started/ for platform-specific instructions)
   # For macOS:
   brew install quarto
   
   # For Linux/Windows: Download from https://quarto.org/docs/get-started/
   ```

4. **Install Claude Code CLI:**
   ```bash
   # Install Claude Code CLI
   curl -fsSL https://claude.ai/install.sh | sh
   
   # Or via npm (if you prefer)
   npm install -g @anthropic/claude-code
   ```

5. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

## Usage

### Automated Workflow (Recommended)

1. **Edit/Create Guidelines**: Create or edit .qmd files in the `guidelines/` directory
2. **Save and Commit**: Save your changes and commit to git
3. **Push to GitHub**: Push to the main branch
4. **Automatic Deployment**: GitHub Actions will automatically:
   - Build PDFs and HTML from your .qmd files
   - Deploy the PWA to GitHub Pages
   - Make everything available at your GitHub Pages URL

### Manual Development (Optional)

For local development and testing:

```bash
# Build guidelines locally
./scripts/build.sh

# Watch for changes and auto-rebuild
./scripts/watch.sh

# Manual deployment (not needed with GitHub Actions)
./scripts/deploy.sh
```

### GitHub Pages Setup

1. Go to your repository settings
2. Navigate to "Pages" section  
3. Select "GitHub Actions" as the source
4. Your site will be available at `https://yourusername.github.io/repository-name`

### Using Claude Code

Start Claude Code in interactive mode:
```bash
claude-code
```

Common Claude Code commands for this project:
- `claude-code "Add a new medical guideline for [condition]"`
- `claude-code "Update the PWA styling"`
- `claude-code "Fix any issues with the build script"`

## Features

- **Quarto-based Guidelines**: Write guidelines in Quarto markdown (.qmd) for enhanced formatting and features
- **Multiple Output Formats**: Generate PDF, HTML, and other formats from the same source
- **Advanced Formatting**: Cross-references, citations, tables, and code execution support
- **Progressive Web App**: Access guidelines through a mobile-friendly web interface
- **GitHub Pages Integration**: Automatic deployment to GitHub Pages
- **Development Tools**: Watch mode and build automation
- **AI-Assisted Development**: Enhanced with Claude Code for rapid development

## Contributing

1. Create a new guideline in the `guidelines/` directory
2. Use Claude Code to assist with formatting and content
3. Run `./scripts/build.sh` to generate PDFs
4. Test the PWA locally by serving the `docs/` directory
5. Deploy with `./scripts/deploy.sh`

## License

[Add your license here]