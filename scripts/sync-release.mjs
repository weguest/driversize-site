/* ==========================================================================
   DriverSize — aponta o botão de download para a última release publicada.

   Uso: node scripts/sync-release.mjs
        GITHUB_TOKEN=... node scripts/sync-release.mjs   (recomendado no CI)

   Lê a release mais recente de weguest/driversize, escolhe o instalador
   (DriverSize-<versão>-setup.exe) e atualiza index.html (fonte PT) e o
   README. As páginas en/es/fr são regeradas pelo build.mjs.
   ========================================================================== */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.REPO || 'weguest/driversize';
const API = 'https://api.github.com/repos/' + REPO + '/releases/latest';

/* Qualquer link de instalador, de qualquer versão, em qualquer página. */
const LINK_RE =
  /https:\/\/github\.com\/weguest\/driversize\/releases\/download\/[^/"'\s]+\/DriverSize-[^/"'\s]+-setup\.exe/g;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'driversize-site',
  'X-GitHub-Api-Version': '2022-11-28'
};
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (token) headers.Authorization = 'Bearer ' + token;

const response = await fetch(API, { headers });

if (!response.ok) {
  console.error('GitHub API respondeu ' + response.status + ' para ' + API);
  process.exit(1);
}

const release = await response.json();
const setup = (release.assets || []).find((asset) => /-setup\.exe$/i.test(asset.name));

if (!setup) {
  console.error('A release ' + release.tag_name + ' não tem instalador -setup.exe; site mantido como está.');
  process.exit(1);
}

const url = 'https://github.com/' + REPO + '/releases/download/' + release.tag_name + '/' + setup.name;

let changed = 0;

for (const file of ['index.html', 'README.md']) {
  const path = join(ROOT, file);
  const current = readFileSync(path, 'utf8');
  const next = current.replace(LINK_RE, url);
  if (next === current) continue;
  writeFileSync(path, next, 'utf8');
  changed += 1;
  console.log('✓ ' + file + ' → ' + release.tag_name);
}

if (!changed) console.log('• já aponta para a última release (' + release.tag_name + ')');
