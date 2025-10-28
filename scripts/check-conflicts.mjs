import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const conflictMarkers = ['<<<<<<<', '=======', '>>>>>>>'];

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map(file => file.trim())
  .filter(Boolean);

const offenders = [];

for (const file of files) {
  if (file === 'scripts/check-conflicts.mjs') {
    continue;
  }
  if (!existsSync(file)) {
    continue;
  }
  const content = readFileSync(file, 'utf8');
  if (conflictMarkers.some(marker => content.includes(marker))) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error('Merge conflict markers detected:');
  for (const file of offenders) {
    console.error(` - ${file}`);
  }
  process.exitCode = 1;
} else {
  console.log('No merge conflict markers detected.');
}
