#!/bin/bash

# Watch script for development
# Monitors changes and rebuilds automatically

echo "Starting watch mode for Medical Guidelines..."

# Function to rebuild on changes
rebuild() {
    echo "Changes detected, rebuilding..."
    ./scripts/build.sh
}

# Watch for changes in guidelines directory (.qmd files)
if command -v fswatch &> /dev/null; then
    fswatch -o guidelines/*.qmd | while read f; do rebuild; done
elif command -v inotifywait &> /dev/null; then
    while inotifywait -e modify guidelines/*.qmd; do rebuild; done
else
    echo "No file watching tool found (fswatch or inotifywait)"
    echo "Please install one of these tools for watch mode"
fi