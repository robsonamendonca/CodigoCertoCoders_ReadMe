// process.js
const fs = require('fs');
const path = require('path');

function loadBadges() {
  try {
    if (fs.existsSync('badges.json')) {
      const raw = fs.readFileSync('badges.json', 'utf8').trim();
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (err) {
    console.log('⚠️  Criando novo arquivo badges.json...');
  }
  
  const defaultData = {
    mestreDaDocumentacao: [],
    devApoiaDev: []
  };
  fs.writeFileSync('badges.json', JSON.stringify(defaultData, null, 2));
  return defaultData;
}

function ensureDirectories() {
  ['badges', 'certificados'].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function main() {
  const badgeType = process.env.BADGE_TYPE;
  const githubUser = process.env.PR_USER;
  const repository = process.env.REPO_URL;
  const date = new Date().toISOString().split('T')[0];

  console.log(`📝 Processando badge ${badgeType} para ${githubUser}`);

  // Validações de segurança
  if (!badgeType || !githubUser) {
    throw new Error('Variáveis de ambiente necessárias não definidas');
  }

  if (!['mestre', 'apoia'].includes(badgeType)) {
    throw new Error('Tipo de badge inválido');
  }

  ensureDirectories();
  const badges = loadBadges();

  // Verificar duplicata
  const badgeArray = badgeType === 'mestre' ? badges.mestreDaDocumentacao : badges.devApoiaDev;
  const existingBadge = badgeArray.find(b => b.githubUser === githubUser);
  
  if (existingBadge) {
    console.log('ℹ️  Usuário já possui este badge, atualizando data...');
    existingBadge.date = date;
  } else {
    badgeArray.push({
      githubUser,
      name: githubUser,
      repository,
      date
    });
    console.log('✅ Novo badge adicionado');
  }

  fs.writeFileSync('badges.json', JSON.stringify(badges, null, 2));

  // Gerar badge SVG
  const badgeLabel = badgeType === 'mestre' ? 'Mestre da Documentação' : 'Dev que Apoia Dev';
  const svgContent = `<svg width="420" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="420" height="100" fill="#1e1e1e" rx="12"/>
  <text x="210" y="55" font-size="20" fill="white" font-family="Arial" text-anchor="middle">${badgeLabel}</text>
</svg>`;

  const svgFilename = `badges/${githubUser}-${badgeType}.svg`;
  fs.writeFileSync(svgFilename, svgContent);
  console.log(`✅ Badge SVG criado: ${svgFilename}`);

  // Gerar certificado
  const templatePath = `templates/${badgeType === 'mestre' ? 'MestreDaDocumentacao' : 'DevApoiaDev'}.md`;
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template não encontrado: ${templatePath}`);
  }

  let template = fs.readFileSync(templatePath, 'utf8');
  template = template
    .replace(/{{githubUser}}/g, githubUser)
    .replace(/{{name}}/g, githubUser)
    .replace(/{{repository}}/g, repository)
    .replace(/{{date}}/g, date);

  const certFilename = `certificados/${githubUser}-${badgeType === 'mestre' ? 'MestreDaDocumentacao' : 'DevApoiaDev'}.md`;
  fs.writeFileSync(certFilename, template);
  console.log(`✅ Certificado criado: ${certFilename}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error('❌ Erro no process.js:', error.message);
    process.exit(1);
  }
}

module.exports = { loadBadges, main };