/**
 * main.ts: Package game files and screenshots into submission dossier.
 */
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-threejs.ts';

const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const rootDir = process.cwd();

mkdirSync(outDir, { recursive: true });

cpSync(join(rootDir, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(rootDir, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossierBytes = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossierBytes);

console.log(`Dossier written: ${join(outDir, 'dossier.json')} (${dossierBytes.length} bytes)`);
