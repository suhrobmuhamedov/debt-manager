// apps/web/bundle-check.mjs
// Ishlatish: node bundle-check.mjs  (build qilgandan keyin)

import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const DIST_DIR = './dist/assets';

// Telegram Mini App uchun maqsadli hajmlar (gzip taxminiy)
const BUDGET = {
  'chunk-react-core': 45_000,
  'chunk-trpc':       20_000,
  'chunk-ui':         15_000,
  'chunk-router':      5_000,
  'chunk-forms':      15_000,
  'chunk-i18n':       10_000,
};

async function checkBundles() {
  let files;
  try {
    files = await readdir(DIST_DIR);
  } catch {
    console.error('❌ dist/assets topilmadi. Avval: npm run build');
    process.exit(1);
  }

  const jsFiles = files.filter(f => f.endsWith('.js'));
  const results = [];

  for (const file of jsFiles) {
    const { size } = await stat(join(DIST_DIR, file));
    const baseName = file.replace(/-[a-f0-9]+\.js$/, '');
    const gzipEstimate = Math.round(size * 0.3);
    results.push({ file, size, gzipEstimate, budget: BUDGET[baseName] });
  }

  results.sort((a, b) => b.size - a.size);

  console.log('\n📦 BUNDLE HAJMLARI\n');
  console.log('Fayl nomi'.padEnd(52) + 'Hajm'.padEnd(12) + 'Gzip (~)'.padEnd(12) + 'Holat');
  console.log('─'.repeat(85));

  let totalSize = 0;
  let hasWarning = false;

  for (const { file, size, gzipEstimate, budget } of results) {
    totalSize += size;
    const overBudget = budget && gzipEstimate > budget;
    if (overBudget) hasWarning = true;

    const status = overBudget
      ? `⚠️  Budget oshdi (+${((gzipEstimate - budget) / 1024).toFixed(1)}kb)`
      : budget ? '✅ OK' : '';

    console.log(
      file.padEnd(52),
      `${(size / 1024).toFixed(1)}kb`.padEnd(12),
      `~${(gzipEstimate / 1024).toFixed(1)}kb`.padEnd(12),
      status
    );
  }

  console.log('─'.repeat(85));
  const totalGzip = (totalSize * 0.3 / 1024).toFixed(1);
  console.log(`${'JAMI'.padEnd(52)}${(totalSize / 1024).toFixed(1)}kb`.padEnd(64) + `~${totalGzip}kb`);

  // Initial load estimate
  const initialChunks = results.filter(({ file }) =>
    ['chunk-react-core', 'chunk-trpc', 'chunk-ui', 'chunk-router', 'chunk-state', 'index'].some(n => file.includes(n))
  );
  const initialSize = initialChunks.reduce((s, f) => s + f.size, 0);
  const initialGzip = (initialSize * 0.3 / 1024).toFixed(0);

  console.log(`\n🚀 Initial load: ~${initialGzip}kb gzip (${(initialSize / 1024).toFixed(0)}kb raw)`);
  console.log(`   Telegram tavsiyasi: < 200kb gzip`, initialSize * 0.3 < 200_000 ? '✅' : '⚠️');

  if (hasWarning) {
    console.log('\n⚠️  Ba\'zi chunklar budgetdan oshdi. vite.config.ts ni tekshiring.\n');
  } else {
    console.log('\n✅ Barcha chunklar budget ichida!\n');
  }
}

checkBundles();
