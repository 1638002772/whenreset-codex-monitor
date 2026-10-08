import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cloudflare = resolve(root, 'cloudflare');
const publicDir = resolve(cloudflare, 'public');

await mkdir(publicDir, { recursive: true });
for (const name of ['index.html', 'styles.css', 'signal-console.css', 'app.js']) {
  await copyFile(resolve(root, name), resolve(publicDir, name));
}

const [posts, events, state, archive] = await Promise.all(
  ['posts.json', 'events.json', 'state.json', 'archive-meta.json'].map((name) =>
    readFile(resolve(root, 'data', name), 'utf8').then(JSON.parse),
  ),
);
const seenIds = [...new Set([...(state.seenIds || []), ...posts.map((post) => post.id)])].slice(-200);
const seed = {
  posts,
  events,
  state: { ...state, seenIds, initialized: true, monitorState: 'starting', lastSuccessAt: null, consecutiveFailures: 0, lastError: null },
  archive,
};
await writeFile(resolve(cloudflare, 'seed-data.js'), `export const seed = ${JSON.stringify(seed)};\n`, 'utf8');
console.log(`Prepared Cloudflare assets and public history (${posts.length} posts, ${events.length} events).`);
