const path = require('path');
const fs = require('fs');
const { initDB, saveDB, prepare, getDB } = require('./db');

async function seed() {
  await initDB();
  const db = getDB();

  function tableCount(tableName) {
    try {
      const result = db.exec(`SELECT COUNT(*) as c FROM ${tableName}`);
      return result[0]?.values[0]?.[0] || 0;
    } catch {
      return 0;
    }
  }

  const contentCount = tableCount('content');
  const photosCount = tableCount('photos');
  const logosCount = tableCount('logos');
  const servicesCount = tableCount('services');

  console.log(`Estado atual: content=${contentCount}, photos=${photosCount}, logos=${logosCount}, services=${servicesCount}`);

  const hasAnyData = contentCount > 0 || photosCount > 0 || logosCount > 0 || servicesCount > 0;
  if (hasAnyData && contentCount > 0) {
    console.log('Database already has data, skipping seed.');
    return;
  }

  const content = {
    hero_title: 'Protegendo pessoas, fortalecendo empresas',
    hero_subtitle: 'Especialistas em Segurança do Trabalho',
    hero_slogan: 'Vamos juntos construir ambientes de trabalho mais seguros? Entre em contato com a M. Oliveira e agende uma visita técnica.',
    about_title: 'Quem Somos',
    about_text: 'A M. Oliveira – Segurança do Trabalho é uma empresa especializada em soluções integradas de saúde e segurança ocupacional, com foco na prevenção de acidentes, promoção da cultura de segurança e conformidade com as normas regulamentadoras (NR\'s). Com experiência consolidada no setor, atuamos com responsabilidade técnica, ética e comprometimento com os resultados dos nossos clientes, sejam eles da construção civil, indústria, comércio ou serviços.',
    services_title: 'Nossos Serviços',
    services_desc: 'Soluções integradas em segurança do trabalho, saúde ocupacional e gestão de riscos para sua empresa.',
    treinamentos_title: 'Fotos de Treinamento',
    treinamentos_desc: 'Conheça a nossa metodologia prática. Treinamentos dinâmicos, com foco total na absorção do conteúdo e na aplicação real no ambiente de trabalho.',
    clientes_title: 'Clientes & Parceiros',
    clientes_desc: 'Empresas de diversos segmentos escolheram a M. Oliveira para proteger o que mais importa: seus colaboradores.',
    contato_title: 'Solicite um Orçamento',
    contato_desc: 'Preencha o formulário e nossa equipe entrará em contato em até 24 horas úteis.',
    footer_text: '© 2025 M. Oliveira Segurança do Trabalho. Todos os direitos reservados.',
    diferenciais_title: 'Diferenciais M. Oliveira',
    diferenciais_desc: 'O que nos torna a escolha certa para a gestão de segurança da sua empresa.'
  };

  for (const [key, value] of Object.entries(content)) {
    prepare('INSERT INTO content (section, value) VALUES (?, ?)').run([key, value]);
  }
  console.log('Content seeded.');

  const services = [
    { title: 'PGR', description: 'Elaboração do Programa de Gerenciamento de Riscos conforme NR-1 e legislação vigente.', icon: '📋', sort_order: 1 },
    { title: 'PCMSO', description: 'Programa de Controle Médico de Saúde Ocupacional com laudos e acompanhamento completo.', icon: '🩺', sort_order: 2 },
    { title: 'Treinamentos NR', description: 'Treinamentos presenciais e online conforme NR-05, NR-12, NR-18, NR-35 e demais normas.', icon: '🎓', sort_order: 3 },
    { title: 'Análise Documental', description: 'Elaboração e gestão de documentos para sua empresa.', icon: '📒', sort_order: 4 },
    { title: 'Análise de Risco', description: 'APR, Permissão de Trabalho, mapeamento e controle de riscos ocupacionais.', icon: '🦺', sort_order: 5 },
    { title: 'eSocial', description: 'Lançamento e gestão dos eventos S-2210, S-2220 e S-2240.', icon: '📊', sort_order: 6 },
    { title: 'Consultoria em Segurança do Trabalho', description: 'Auxílio na prevenção de acidentes e suporte na gestão em SST.', icon: '🏗️', sort_order: 7 },
    { title: 'Trabalho em Altura - NR-35', description: 'Cursos práticos e teóricos em trabalho em altura, garantindo a segurança de sua equipe.', icon: '🧗', sort_order: 8 },
    { title: 'Diálogos de Segurança (DDS)', description: 'Condução de conversas educativas para reforço contínuo da cultura de segurança.', icon: '👷🏻', sort_order: 9 },
    { title: 'Investigação de Acidentes', description: 'Análise de causas, elaboração de relatórios e proposição de medidas preventivas.', icon: '🕵🏻‍♀️', sort_order: 10 },
    { title: 'Relatórios e Indicadores', description: 'Elaboração de relatórios mensais alinhados aos indicadores corporativos, com visualizações dinâmicas em Power BI.', icon: '📃', sort_order: 11 },
    { title: 'Suporte em fiscalizações', description: 'Atendimento e suporte em fiscalizações MTE, INSS, entre outros órgãos.', icon: '🔍', sort_order: 12 }
  ];

  for (const s of services) {
    prepare('INSERT INTO services (title, description, icon, sort_order) VALUES (?, ?, ?, ?)').run([s.title, s.description, s.icon, s.sort_order]);
  }

  const trainingServices = [
    { title: 'Treinamentos em Altura - NR 35', description: 'Treinamentos práticos e teóricos para trabalho em altura, conforme NR 35.', icon: '🧗', sort_order: 13 },
    { title: 'Sinaleiros e Operadores de Grua - NR 18', description: 'Treinamento especializado para equipe de sinaleiros e operadores de grua, conforme NR 18.', icon: '🏗️', sort_order: 14 },
    { title: 'Cadeira Suspensa - NR 18', description: 'Treinamento de cadeira suspensa para atividades em altura, conforme NR 18.', icon: '🧰', sort_order: 15 },
    { title: 'Formação de CIPA', description: 'Formação completa da Comissão Interna de Prevenção de Acidentes.', icon: '👥', sort_order: 16 },
    { title: 'Empilhadeira - NR 11', description: 'Treinamento para operação segura de empilhadeiras, conforme NR 11.', icon: '🚛', sort_order: 17 },
    { title: 'Integração - NR 18', description: 'Treinamento de integração para novos colaboradores, conforme NR 18.', icon: '🤝', sort_order: 18 },
    { title: 'Campanhas de Conscientização', description: 'Campanhas mensais de conscientização em segurança do trabalho.', icon: '📣', sort_order: 19 },
    { title: 'Primeiros Socorros', description: 'Treinamento de primeiros socorros para preparo e resposta a emergências.', icon: '🚑', sort_order: 20 }
  ];

  for (const s of trainingServices) {
    prepare('INSERT INTO services (title, description, icon, sort_order, active) VALUES (?, ?, ?, ?, 0)').run([s.title, s.description, s.icon, s.sort_order]);
  }
  console.log('Services seeded.');

  const diferenciais = [
    { title: 'Treinamentos com foco prático', description: 'Treinamentos com foco prático e simulações reais.', icon: '🛠️', sort_order: 1 },
    { title: 'Atendimento personalizado', description: 'Atendimento personalizado e consultoria próxima.', icon: '🤝', sort_order: 2 },
    { title: 'Profissionais qualificados', description: 'Atuação com profissionais qualificados e experientes.', icon: '🏆', sort_order: 3 },
    { title: 'Tecnologia e análise de dados', description: 'Uso de tecnologias e ferramentas de análise de dados.', icon: '📊', sort_order: 4 },
    { title: 'Parcerias estratégicas', description: 'Parcerias com especialistas para maior abrangência de serviços.', icon: '🔗', sort_order: 5 }
  ];

  for (const d of diferenciais) {
    prepare('INSERT INTO diferenciais (title, description, icon, sort_order) VALUES (?, ?, ?, ?)').run([d.title, d.description, d.icon, d.sort_order]);
  }
  console.log('Diferenciais seeded.');

  function filenameExists(table, filename) {
    try {
      const stmt = prepare(`SELECT id FROM ${table} WHERE filename = ? LIMIT 1`);
      stmt.bind([filename]);
      return stmt.step();
    } catch {
      return false;
    }
  }

  const PHOTOS_DST = path.join(__dirname, 'uploads', 'photos');
  let photosImported = 0;
  if (fs.existsSync(PHOTOS_DST)) {
    const files = fs.readdirSync(PHOTOS_DST).filter(f => /\.(jpe?g|png)$/i.test(f));
    for (const f of files) {
      if (!filenameExists('photos', f)) {
        prepare('INSERT INTO photos (filename, title) VALUES (?, ?)').run([f, f.replace(/\.(jpe?g|png)$/i, '').substring(0, 60)]);
        photosImported++;
      }
    }
    console.log(`${photosImported} new photos imported from uploads (${files.length} total found).`);
  }

  const LOGOS_DST = path.join(__dirname, 'uploads', 'logos');
  let logosImported = 0;
  if (fs.existsSync(LOGOS_DST)) {
    const files = fs.readdirSync(LOGOS_DST).filter(f => /\.(png|jpe?g|svg)$/i.test(f));
    for (const f of files) {
      const company = path.parse(f).name;
      if (!filenameExists('logos', f)) {
        prepare('INSERT INTO logos (filename, company_name) VALUES (?, ?)').run([f, company]);
        logosImported++;
      }
    }
    console.log(`${logosImported} new logos imported from uploads (${files.length} total found).`);
  }

  saveDB();
  console.log('Seed completed successfully!');
}

if (require.main === module) {
  seed().catch(e => { console.error('Seed error:', e); process.exit(1); });
}

module.exports = { seed };
