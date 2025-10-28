import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const conflictPatterns = [
  /<<<<<<< /,
  /=======/,
  />>>>>>> /
];

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split('\n')
  .map(file => file.trim())
  .filter(Boolean);

const offenders = [];

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of conflictPatterns) {
    if (pattern.test(content)) {
      offenders.push({ file, pattern: pattern.source });
      break;
    }
  }
}

if (offenders.length > 0) {
  console.error('Merge conflict markers detected:');
  for (const offender of offenders) {
    console.error(` - ${offender.file} (matched /${offender.pattern}/)`);
  }
  process.exitCode = 1;
} else {
  console.log('No merge conflict markers detected.');
}
