#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function readEnv(file) {
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith('#'))
      .map((l) => l.split('=')[0]);
  } catch (e) {
    return [];
  }
}

function scanForProcessEnv(dir) {
  const found = new Set();
  const walk = (d) => {
    for (const name of fs.readdirSync(d)) {
      const full = path.join(d, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (name === 'node_modules' || name === '.git') continue;
        walk(full);
      } else if (/\.(js|mjs|jsx|ts|tsx)$/i.test(name)) {
        const txt = fs.readFileSync(full, 'utf8');
        const re = /process\.env\.([A-Z0-9_]+)/g;
        let m;
        while ((m = re.exec(txt))) found.add(m[1]);
      }
    }
  };
  walk(dir);
  return Array.from(found).sort();
}

const repoRoot = process.cwd();
const envExample = path.join(repoRoot, '.env.example');
const envLocal = path.join(repoRoot, '.env');

const exampleKeys = new Set(readEnv(envExample));
const localKeys = new Set(readEnv(envLocal));
const codeKeys = new Set(scanForProcessEnv(repoRoot));

function diff(a, b) {
  return Array.from(a).filter((k) => !b.has(k));
}

console.log('Env Audit Report');
console.log('------------------');
console.log('Keys in .env.example:', exampleKeys.size);
console.log('Keys in .env (local):', localKeys.size);
console.log('Keys referenced in code:', codeKeys.size);

console.log('\nKeys referenced in code but missing from .env.example:');
console.log(diff(codeKeys, exampleKeys).join('\n') || '(none)');

console.log('\nKeys present locally but not in .env.example (possible secrets):');
console.log(diff(localKeys, exampleKeys).join('\n') || '(none)');

console.log('\nKeys present in .env.example but not used in code:');
console.log(diff(exampleKeys, codeKeys).join('\n') || '(none)');

console.log('\nRecommendation: rotate keys listed in "present locally but not in .env.example" if any look like secrets, and add missing code-referenced keys to .env.example.');
