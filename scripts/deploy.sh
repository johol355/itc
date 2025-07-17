#!/bin/bash

# Deploy script for Medical Guidelines to GitHub Pages

echo "Deploying Medical Guidelines to GitHub Pages..."

# Build the project first
./scripts/build.sh

# Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."

# Copy files to docs directory (GitHub Pages source)
# The docs/ directory is already set up for GitHub Pages

# Commit and push changes
git add .
git commit -m "Deploy medical guidelines $(date)"
git push origin main

echo "Deployment complete!"
echo "Site will be available at: https://USERNAME.github.io/REPOSITORY"