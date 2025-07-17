# Medical Guidelines Source Files

This directory contains the source files for medical guidelines written in Quarto markdown (.qmd) format.

## Structure

- `*.qmd` - Quarto markdown source files for guidelines
- `images/` - Images and diagrams for guidelines
- `templates/` - Template files for new guidelines

## Guidelines

- Each guideline should be in its own Quarto markdown file
- Use consistent naming: `condition-treatment-guideline.qmd`
- Include YAML frontmatter with metadata at the top of each file
- Use Quarto features like cross-references, citations, and code execution

## Quarto Features

- **YAML Frontmatter**: Metadata and output format configuration
- **Cross-references**: Link between sections, figures, and tables
- **Citations**: Built-in bibliography support
- **Code Execution**: Embed R, Python, or other code (if needed for data analysis)
- **Multiple Outputs**: Generate HTML, PDF, and other formats from the same source