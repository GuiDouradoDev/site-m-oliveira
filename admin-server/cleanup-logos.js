const { initDB, saveDB, getDB } = require('./db');
const path = require('path');
const fs = require('fs');

async function cleanup() {
  await initDB();
  const db = getDB();

  console.log('=== LIMPANDO LOGOS DUPLICADOS ===\n');

  const allLogosResult = db.exec('SELECT id, filename, company_name FROM logos ORDER BY company_name, id');
  const logos = [];
  
  if (allLogosResult.length > 0) {
    for (const row of allLogosResult[0].values) {
      logos.push({
        id: row[0],
        filename: row[1],
        company_name: row[2]
      });
    }
  }

  console.log('Total de logos no banco:', logos.length);

  const grouped = {};
  logos.forEach(logo => {
    const key = logo.company_name.toLowerCase();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(logo);
  });

  const toDelete = [];
  const UPLOADS_DIR = path.join(__dirname, 'uploads', 'logos');

  for (const [company, items] of Object.entries(grouped)) {
    if (items.length > 1) {
      console.log('\nEmpresa:', company.toUpperCase());
      
      items.forEach(item => {
        const ext = path.extname(item.filename).toLowerCase();
        const priority = ext === '.png' ? 3 : (ext === '.svg' ? 2 : 1);
        item.priority = priority;
        console.log('  - ID:', item.id, '|', item.filename, '(prioridade:', priority, ')');
      });

      items.sort((a, b) => b.priority - a.priority);
      
      const keep = items[0];
      const remove = items.slice(1);
      
      console.log('  → Mantendo:', keep.filename);
      remove.forEach(r => {
        console.log('  → Removendo:', r.filename);
        toDelete.push(r);
      });
    }
  }

  if (toDelete.length === 0) {
    console.log('\nNenhum logo duplicado para remover.');
  } else {
    console.log('\n=== REMOVENDO', toDelete.length, 'LOGOS ===\n');
    
    for (const logo of toDelete) {
      db.run('DELETE FROM logos WHERE id = ?', [logo.id]);
      console.log('Removido do banco:', logo.filename, '(ID:', logo.id, ')');
      
      const filePath = path.join(UPLOADS_DIR, logo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Arquivo removido:', filePath);
      }
    }

    saveDB();
  }

  console.log('\n=== CONCLUIDO ===');
  console.log('Logos removidos:', toDelete.length);
  
  const finalCount = db.exec('SELECT COUNT(*) FROM logos')[0].values[0][0];
  console.log('Logos restantes:', finalCount);
}

cleanup().catch(e => { console.error('Erro:', e); process.exit(1); });
