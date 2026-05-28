const { initDB, saveDB, prepare, getDB } = require('./db');

async function cleanup() {
  await initDB();
  const db = getDB();

  console.log('=== LIMPANDO DUPLICATAS ===\n');

  const logosResult = db.exec('SELECT filename, COUNT(*) as cnt FROM logos GROUP BY filename HAVING cnt > 1');
  let duplicateLogos = 0;
  if (logosResult.length > 0) {
    console.log('Logos duplicados encontrados:');
    for (const row of logosResult[0].values) {
      const filename = row[0];
      const count = row[1];
      console.log(`  - ${filename}: ${count} duplicatas`);
      
      const stmt = db.prepare('SELECT id FROM logos WHERE filename = ? ORDER BY id ASC');
      stmt.bind([filename]);
      const ids = [];
      while (stmt.step()) {
        ids.push(stmt.getAsObject().id);
      }
      
      if (ids.length > 1) {
        const toDelete = ids.slice(1);
        for (const id of toDelete) {
          db.run('DELETE FROM logos WHERE id = ?', [id]);
          duplicateLogos++;
        }
      }
    }
  }
  console.log(`\nLogos duplicados removidos: ${duplicateLogos}`);

  const photosResult = db.exec('SELECT filename, COUNT(*) as cnt FROM photos GROUP BY filename HAVING cnt > 1');
  let duplicatePhotos = 0;
  if (photosResult.length > 0) {
    console.log('\nFotos duplicadas encontradas:');
    for (const row of photosResult[0].values) {
      const filename = row[0];
      const count = row[1];
      console.log(`  - ${filename}: ${count} duplicatas`);
      
      const stmt = db.prepare('SELECT id FROM photos WHERE filename = ? ORDER BY id ASC');
      stmt.bind([filename]);
      const ids = [];
      while (stmt.step()) {
        ids.push(stmt.getAsObject().id);
      }
      
      if (ids.length > 1) {
        const toDelete = ids.slice(1);
        for (const id of toDelete) {
          db.run('DELETE FROM photos WHERE id = ?', [id]);
          duplicatePhotos++;
        }
      }
    }
  }
  console.log(`\nFotos duplicadas removidas: ${duplicatePhotos}`);

  saveDB();
  
  console.log('\n=== LIMPEZA CONCLUIDA ===');
  console.log(`Total de itens removidos: ${duplicateLogos + duplicatePhotos}`);
}

cleanup().catch(e => { console.error('Erro:', e); process.exit(1); });
