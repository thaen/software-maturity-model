import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CatalogStore } from '../store.mjs';
const store = new CatalogStore({
  databaseFile: resolve('web/data/catalog.sqlite'),
  dataFile: resolve('web/data/catalog.json'),
});
try {
  const text = JSON.stringify(store.load(), null, 2) + '\n';
  if (process.argv[2]) writeFileSync(process.argv[2], text);
  else process.stdout.write(text);
} finally {
  store.close();
}
