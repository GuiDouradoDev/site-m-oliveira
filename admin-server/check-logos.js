const { initDB, getDB } = require('./db');

async function check() {
  await initDB();
  const db = getDB();
  
  console.log('=== LOGOS NO BANCO ===');
  const logosResult = db.exec('SELECT id, filename, company_name FROM logos ORDER BY company_name, id');
  if (logosResult.length > 0) {
    for (const row of logosResult[0].values) {
      console.log('ID:', row[0], '| Empresa:', row[2], '| Arquivo:', row[1]);
    }
  }
  console.log('');
  console.log('Total de logos:', logosResult[0]?.values?.length || 0);
  
  console.log('');
  console.log('=== CONTAGEM POR EMPRESA ===');
  const countResult = db.exec('SELECT company_name, COUNT(*) as cnt FROM logos GROUP BY company_name ORDER BY cnt DESC');
  if (countResult.length > 0) {
    for (const row of countResult[0].values) {
      if (row[1] > 1) {
        console.log('⚠️  ' + row[0] + ': ' + row[1] + ' registros (DUPLICADO)');
      } else {
        console.log('   ' + row[0] + ': ' + row[1] + ' registro');
      }
    }
  }
}

check().catch(e => console.error(e));
