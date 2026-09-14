import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const generatedPaths = [
  resolve(process.cwd(), '.next'),
  resolve(process.cwd(), 'tsconfig.tsbuildinfo'),
];

for (const generatedPath of generatedPaths) {
  rmSync(generatedPath, { recursive: true, force: true });
}

console.log('Cleared stale Next.js and TypeScript development assets.');