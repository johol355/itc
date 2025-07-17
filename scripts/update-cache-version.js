#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read current service worker
const swPath = path.join(__dirname, '../docs/sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Extract current version number
const versionMatch = swContent.match(/const CACHE_VERSION = 'v(\d+)'/);
if (!versionMatch) {
    console.error('Could not find cache version in service worker');
    process.exit(1);
}

const currentVersion = parseInt(versionMatch[1]);
const newVersion = currentVersion + 1;

// Update the version
swContent = swContent.replace(
    /const CACHE_VERSION = 'v\d+'/,
    `const CACHE_VERSION = 'v${newVersion}'`
);

// Write back to file
fs.writeFileSync(swPath, swContent);
console.log(`Cache version updated: v${currentVersion} -> v${newVersion}`);