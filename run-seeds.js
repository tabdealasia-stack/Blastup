const { spawnSync } = require('child_process');

console.log('Running master...');
spawnSync('node', ['dist/scripts/seed-master-categories.js'], { stdio: 'inherit' });

console.log('Running phase 3...');
spawnSync('node', ['dist/scripts/seed-phase3-categories.js'], { stdio: 'inherit' });

console.log('Running restaurant...');
spawnSync('node', ['dist/scripts/seed-restaurant-templates.js'], { stdio: 'inherit' });

console.log('Running travel...');
spawnSync('node', ['dist/scripts/seed-travel-templates.js'], { stdio: 'inherit' });

