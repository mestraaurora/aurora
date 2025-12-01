const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { Pool } = require('pg');
const axios = require('axios');

// Load configuration with fallback to environment variables
let config;
try {
  config = require('./config');
} catch (error) {
  console.log('Config file not found, using environment variables');
  config = {
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true' ? true : (process.env.EMAIL_ENABLED === undefined ? true : false),
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      },
      defaults: {
        from: process.env.EMAIL_FROM
      }
    },
    aiService: {
      apiUrl: process.env.AI_SERVICE_URL || 'https://openrouter.ai/api/v1/chat/completions',
      apiKey: process.env.AI_SERVICE_API_KEY,
      model: process.env.AI_SERVICE_MODEL || 'x-ai/grok-4.1-fast:free'
    },
    database: {
      url: process.env.DATABASE_URL
    },
    server: {
      port: process.env.PORT
    }
  };
}

// Validate critical environment variables
if (!config.database.url) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

if (config.email.enabled && (!config.email.smtp.host || !config.email.smtp.auth.user || !config.email.smtp.auth.pass)) {
  console.error('ERROR: SMTP configuration is required when email is enabled');
  console.error('Please set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables');
  process.exit(1);
}

if (config.aiService.apiKey && !config.aiService.apiUrl) {
  console.error('ERROR: AI_SERVICE_URL is required when AI_SERVICE_API_KEY is set');
  process.exit(1);
}

// Create database connection pool
const pool = new Pool({
  connectionString: config.database.url,
  ssl: {
    rejectUnauthorized: false
  }
});

// Create leads table without UNIQUE constraint on email
pool.query(`
  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    sexo TEXT NOT NULL,
    data_nascimento TEXT NOT NULL,
    estado_civil TEXT,
    pergunta TEXT,
    marketing_consent BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).then(() => {
  console.log('Connected to Render Postgres');
}).catch(err => {
  console.error('Failed to connect to Postgres:', err.message);
});

const app = express();
const PORT = process.env.PORT || config.server.port || 3001;

// Middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the terms page
app.get('/terms.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'terms.html'));
});

// Serve the privacy policy page
app.get('/privacy-policy.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'privacy-policy.html'));
});

// Serve the contact page
app.get('/contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

// Serve the about page
app.get('/about.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check endpoint hit');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Validation helper function
function validateRequest(req) {
  console.log('=== STARTING REQUEST VALIDATION ===');
  const errors = [];
  
  console.log('Step V1: Validating nome field');
  if (!req.body.nome || req.body.nome.trim() === '') {
    errors.push('Nome é obrigatório');
  }
  
  console.log('Step V2: Validating sexo field');
  if (!req.body.sexo || (req.body.sexo !== 'masculino' && req.body.sexo !== 'feminino')) {
    errors.push('Sexo é obrigatório e deve ser "masculino" ou "feminino"');
  }
  
  console.log('Step V3: Validating data_nascimento field');
  if (!req.body.data_nascimento || req.body.data_nascimento.trim() === '') {
    errors.push('Data de nascimento é obrigatória');
  }
  
  console.log('Step V4: Validating email field');
  if (!req.body.email || req.body.email.trim() === '') {
    errors.push('E-mail é obrigatório');
  } else {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      errors.push('E-mail inválido');
    }
  }
  
  console.log('Step V5: Validating marketing_consent field');
  // Marketing consent is now required
  if (req.body.marketing_consent !== true) {
    errors.push('Você precisa concordar com o recebimento de comunicações para receber a leitura');
  }
  
  console.log('=== REQUEST VALIDATION COMPLETE ===');
  console.log('Validation result:', errors.length === 0 ? 'PASSED' : 'FAILED', 'with', errors.length, 'errors');
  if (errors.length > 0) {
    console.log('Validation errors:', errors);
  }
  
  return errors;
}

// AI-powered implementation for SaJu reading generation
async function generateSajuReading(userData) {
  console.log('=== STARTING SAJU READING GENERATION ===');
  console.log('Input userData:', {
    nome: userData.nome,
    sexo: userData.sexo,
    data_nascimento: userData.data_nascimento
  });
  
  // Check if AI service is configured
  console.log('Step A: Checking AI service configuration');
  console.log('AI Service config:', {
    hasApiKey: !!config.aiService.apiKey,
    apiUrl: config.aiService.apiUrl,
    model: config.aiService.model
  });
  
  if (!config.aiService.apiKey) {
    console.log('Step A RESULT: AI service not configured, falling back to mock implementation');
    return generateMockSajuReading(userData);
  }
  
  try {
    console.log('Step B: Preparing the prompt for the AI');
    // Prepare the prompt for the AI
    const prompt = createPromptForSajuReading(userData);
    console.log('Step B COMPLETE: Prompt created with length:', prompt.length);
    
    // Make API call to OpenRouter
    console.log('Step C: Calling AI service');
    console.log('AI Request details:', {
      url: config.aiService.apiUrl,
      model: config.aiService.model,
      promptPreview: prompt.substring(0, 100) + '...'
    });
    
    const response = await axios.post(
      config.aiService.apiUrl,
      {
        model: config.aiService.model,
        messages: [
          {
            role: "system",
            content: "Você é Mestra Aurora, uma especialista em leituras de destino coreano SaJu. Gere leituras completas e personalizadas com base nas informações fornecidas."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${config.aiService.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mestraaurora.xyz',
          'X-Title': 'Mestra Aurora SaJu Reader'
        }
      }
    );
    
    console.log('Step C COMPLETE: AI service response received');
    console.log('AI Response status:', response.status);
    console.log('AI Response headers:', Object.keys(response.headers));
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiReading = response.data.choices[0].message.content;
      console.log('Step D: AI reading extracted successfully, length:', aiReading.length);
      console.log('=== SAJU READING GENERATION COMPLETED SUCCESSFULLY ===');
      return aiReading;
    } else {
      console.error('Step D FAILED: Unexpected AI response format:', response.data);
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('Step C FAILED: Error calling AI service:', error.message);
    console.error('Error details:', {
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    console.error('Stack trace:', error.stack);
    // Fallback to mock implementation if AI service fails
    console.log('Step E: Falling back to mock implementation');
    return generateMockSajuReading(userData);
  }
}

// Mock implementation as fallback
function generateMockSajuReading(userData) {
  console.log('=== USING MOCK SAJU READING GENERATION ===');
  console.log('Input userData:', {
    nome: userData.nome,
    sexo: userData.sexo,
    data_nascimento: userData.data_nascimento
  });
  
  const {
    nome,
    sexo,
    data_nascimento,
    tipo_calendario = 'solar',
    hora_nascimento,
    estado_civil,
    tempo_relacionamento,
    pergunta
  } = userData;

  // Parse birth date
  console.log('Step M1: Parsing birth date');
  const birthDate = new Date(data_nascimento);
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();
  console.log('Step M1 COMPLETE: Birth date parsed:', { day, month, year });
  
  // Simple element assignment based on birth year (this is a simplified version)
  console.log('Step M2: Assigning element based on birth year');
  const elements = ['Madeira', 'Fogo', 'Terra', 'Metal', 'Água'];
  const elementIndex = year % 5;
  const element = elements[elementIndex];
  console.log('Step M2 COMPLETE: Element assigned:', element);
  
  // Element characteristics
  console.log('Step M3: Getting element characteristics');
  const elementCharacteristics = {
    'Madeira': {
      metaphor: 'a árvore que cresce em direção ao céu',
      traits: 'criativo, compassivo, com forte capacidade de crescimento',
      challenge: 'aprender a ser mais paciente',
      favorableMonths: 'março, abril, maio e junho',
      healthFocus: 'fígado e sistema nervoso',
      luckyPeriod: 'primavera (setembro a novembro)',
      cautionPeriod: 'agosto e setembro',
      colors: 'verde e azul',
      numbers: '3, 8',
      directions: 'leste e sudeste'
    },
    'Fogo': {
      metaphor: 'a chama que ilumina a escuridão',
      traits: 'entusiasta, carismático e energético',
      challenge: 'controlar impulsos',
      favorableMonths: 'junho, julho, agosto e setembro',
      healthFocus: 'coração e circulação',
      luckyPeriod: 'verão (dezembro a fevereiro)',
      cautionPeriod: 'novembro e dezembro',
      colors: 'vermelho, laranja e roxo',
      numbers: '2, 7',
      directions: 'sul'
    },
    'Terra': {
      metaphor: 'o solo fértil que nutre todas as sementes',
      traits: 'confiável, prática e estável',
      challenge: 'aprender a relaxar mais',
      favorableMonths: 'março, junho, setembro e dezembro',
      healthFocus: 'baço e digestão',
      luckyPeriod: 'finais de cada estação',
      cautionPeriod: 'junho e julho',
      colors: 'amarelo, marrom e bege',
      numbers: '5, 10',
      directions: 'centro e sudoeste'
    },
    'Metal': {
      metaphor: 'o metal precioso que brilha com pureza',
      traits: 'disciplinado, decisivo e valorizador da verdade',
      challenge: 'aprender a ser mais flexível',
      favorableMonths: 'setembro, outubro, novembro e dezembro',
      healthFocus: 'pulmões e pele',
      luckyPeriod: 'outono (março a maio)',
      cautionPeriod: 'fevereiro e março',
      colors: 'branco, cinza e dourado',
      numbers: '4, 9',
      directions: 'oeste e noroeste'
    },
    'Água': {
      metaphor: 'a água que flui e adapta',
      traits: 'intuitivo, sábio e adaptável',
      challenge: 'aprender a confiar mais nos outros',
      favorableMonths: 'dezembro, janeiro, fevereiro e março',
      healthFocus: 'rins e sistema urinário',
      luckyPeriod: 'inverno (junho a agosto)',
      cautionPeriod: 'maio e junho',
      colors: 'preto e azul escuro',
      numbers: '1, 6',
      directions: 'norte'
    }
  };
  
  const char = elementCharacteristics[element];
  console.log('Step M3 COMPLETE: Element characteristics retrieved');
  
  // Generate personalized reading
  console.log('Step M4: Generating personalized reading');
  let reading = `🔮 Leitura Completa de SaJu – Mestra Aurora\n\n`;
  reading += `Querido(a) **${nome}**, com base nos Quatro Pilares do Destino Coreano calculados a partir da sua data de nascimento (${day}/${month}/${year})`;
  
  if (hora_nascimento) {
    reading += `, às ${hora_nascimento} horas`;
  }
  
  reading += `, identifiquei que você é uma pessoa guiada pelo elemento **${element}**.\n\n`;
  
  // Identidade energética
  reading += `## 🌟 Identidade Energética\n`;
  reading += `Sua essência é como ${char.metaphor}. Isso indica alguém ${char.traits}, mas que precisa ${char.challenge}.\n\n`;
  
  // Distribuição dos 5 elementos
  reading += `## 🔮 Distribuição dos 5 Elementos\n`;
  reading += `No seu mapa energético, o elemento dominante é **${element}**, seguido por:\n`;
  reading += `- **Fogo**: Paixão e transformação\n`;
  reading += `- **Terra**: Estabilidade e nutrição\n`;
  reading += `- **Metal**: Clareza e precisão\n`;
  reading += `- **Água**: Intuição e fluidez\n`;
  reading += `- **Madeira**: Crescimento e criatividade\n\n`;
  reading += `Essa combinação única cria o seu perfil energético exclusivo.\n\n`;
  
  // Personalidade e estilo de vida
  reading += `## 🧠 Personalidade e Estilo de Vida\n`;
  reading += `Sua personalidade é marcada por qualidades como determinação e empatia. Você tem talento para compreender os outros e encontrar soluções práticas para problemas complexos. `;
  reading += `Evite a tendência de assumir todas as responsabilidades sozinho, pois isso pode gerar estresse desnecessário. `;
  reading += `Seu estilo de vida tende a ser ${element === 'Terra' ? 'equilibrado e organizado' : element === 'Fogo' ? 'dinâmico e apaixonado' : element === 'Água' ? 'reflexivo e adaptável' : element === 'Madeira' ? 'criativo e empreendedor' : 'metódico e justo'}.\n\n`;
  
  // Carreira, dinheiro e oportunidades
  reading += `## 💼 Carreira, Dinheiro e Oportunidades\n`;
  reading += `Sua carreira prosperará em ambientes que valorizam a ${element === 'Terra' ? 'estabilidade e organização' : element === 'Fogo' ? 'criatividade e liderança' : element === 'Água' ? 'intuição e pesquisa' : element === 'Madeira' ? 'crescimento e inovação' : 'precisão e excelência'}. `;
  reading += `Profissões relacionadas a ${element === 'Terra' ? 'gestão, consultoria, educação ou áreas técnicas' : element === 'Fogo' ? 'arte, entretenimento, vendas ou empreendedorismo' : element === 'Água' ? 'pesquisa, psicologia, tecnologia ou espiritualidade' : element === 'Madeira' ? 'educação, design, saúde ou meio ambiente' : 'finanças, advocacia, engenharia ou consultoria'} têm grande potencial para você. `;
  reading += `Períodos de maior sorte financeira ocorrerão principalmente nos meses de ${char.favorableMonths}.\n\n`;
  
  // Amor e relacionamentos
  reading += `## 💘 Amor e Relacionamentos\n`;
  if (estado_civil) {
    reading += `No seu atual estágio ${getRelationshipStage(estado_civil)}`;
    if (tempo_relacionamento) {
      reading += `, há ${tempo_relacionamento}`;
    }
    reading += `, é importante manter um equilíbrio entre independência e conexão emocional.\n`;
  } else {
    reading += `Você busca relações profundas e significativas. `;
    reading += `Seu parceiro ideal será alguém que valorize a ${element === 'Terra' ? 'estabilidade e a comunicação honesta' : element === 'Fogo' ? 'paixão e a aventura' : element === 'Água' ? 'intimidade e a profundidade' : element === 'Madeira' ? 'crescimento mútuo e liberdade' : 'clareza e o respeito'}.\n`;
  }
  reading += `Evite ${element === 'Terra' ? 'ciúmes e controle excessivo' : element === 'Fogo' ? 'impulsividade e dramatizações' : element === 'Água' ? 'desconfiança e isolamento emocional' : element === 'Madeira' ? 'impaciência e rigidez' : 'rigidez e frieza'}, pois isso pode afastar pessoas importantes.\n\n`;
  
  // Saúde energética
  reading += `## 🩺 Saúde Energética\n`;
  reading += `Cuide especialmente de ${char.healthFocus}. `;
  reading += `Pratique atividades regulares, mantenha uma alimentação equilibrada e reserve momentos para descanso. `;
  reading += `Evite excesso de trabalho e estresse acumulado. `;
  reading += `A meditação e práticas de mindfulness são especialmente benéficas para o seu tipo energético.\n\n`;
  
  // Previsão do próximo ano
  reading += `## 📅 Previsão do Próximo Ano\n`;
  reading += `Nos próximos 12 meses, você terá oportunidades especiais nos meses de ${char.luckyPeriod}. `;
  reading += `Fique atento a novas conexões que podem surgir entre ${getBestConnectionPeriod(element)}. `;
  reading += `Evite grandes decisões nos meses de ${char.cautionPeriod}.\n\n`;
  
  // Tendências dos próximos 5 anos
  reading += `## ⏳ Tendências dos Próximos 5 Anos\n`;
  reading += `Nos próximos cinco anos, você passará por ciclos de ${element === 'Terra' ? 'consolidação e colheita' : element === 'Fogo' ? 'manifestação e expressão' : element === 'Água' ? 'introspecção e sabedoria' : element === 'Madeira' ? 'crescimento e expansão' : 'refinamento e definição'}. `;
  reading += `Será um período propício para ${element === 'Terra' ? 'construir bases sólidas para projetos de longo prazo' : element === 'Fogo' ? 'lançar iniciativas ousadas e expressar sua autenticidade' : element === 'Água' ? 'aprofundar conhecimentos e desenvolver intuição' : element === 'Madeira' ? 'iniciar novos projetos e cultivar relacionamentos' : 'refinar habilidades e buscar excelência'}.\n\n`;
  
  // Cores, direções e ambientes favoráveis
  reading += `## 🎨 Cores, Direções e Ambientes Favoráveis\n`;
  reading += `Para harmonizar sua energia:\n`;
  reading += `- **Cores**: ${char.colors}\n`;
  reading += `- **Números da sorte**: ${char.numbers}\n`;
  reading += `- **Direções favoráveis**: ${char.directions}\n`;
  reading += `- **Ambientes**: Espaços ${element === 'Terra' ? 'acolhedores e organizados' : element === 'Fogo' ? 'iluminados e inspiradores' : element === 'Água' ? 'tranquilos e fluidos' : element === 'Madeira' ? 'verdes e naturais' : 'claros e minimalistas'}\n\n`;
  
  // Pergunta específica
  if (pergunta) {
    reading += `## ❓ Sobre Sua Pergunta\n`;
    reading += `"${pergunta}"\n`;
    reading += `${getAnswerToQuestion(pergunta, element)}\n\n`;
  }
  
  // Conclusão emocional
  reading += `## 💫 Conclusão\n`;
  reading += `Querido(a) ${nome}, esta leitura é um convite para que você se conecte com sua essência mais profunda. `;
  reading += `Os ciclos energéticos que descrevi são oportunidades para seu crescimento, não sentenças imutáveis. `;
  reading += `Lembre-se de que você tem livre-arbítrio para criar a vida que deseja. `;
  reading += `O elemento ${element} em você carrega a sabedoria de ${getElementWisdom(element)}. `;
  reading += `Confie em sua jornada e continue cultivando sua luz interior.\n\n`;
  reading += `_Que os ventos do destino soprem a seu favor._\n`;
  reading += `_Mestra Aurora_`;
  
  console.log('Step M4 COMPLETE: Reading generated with length:', reading.length);
  console.log('=== MOCK SAJU READING GENERATION COMPLETED ===');
  
  return reading;
}

// Helper function to create prompt for AI
function createPromptForSajuReading(userData) {
  const {
    nome,
    sexo,
    data_nascimento,
    tipo_calendario = 'solar',
    hora_nascimento,
    estado_civil,
    tempo_relacionamento,
    pergunta
  } = userData;
  
  let prompt = `Gere uma leitura completa de SaJu (Quatro Pilares do Destino Coreano) para ${nome}, nascido(a) em ${data_nascimento}`;
  
  if (hora_nascimento) {
    prompt += ` às ${hora_nascimento} horas`;
  }
  
  prompt += `. Sexo: ${sexo}, Tipo de calendário: ${tipo_calendario}`;
  
  if (estado_civil) {
    prompt += `, Estado civil: ${estado_civil}`;
    if (tempo_relacionamento) {
      prompt += ` há ${tempo_relacionamento}`;
    }
  }
  
  if (pergunta) {
    prompt += `\n\nPergunta específica do cliente: "${pergunta}"`;
  }
  
  prompt += `\n\nPor favor, forneça uma leitura completa e personalizada seguindo esta estrutura:
1. Identidade Energética
2. Distribuição dos 5 Elementos
3. Personalidade e Estilo de Vida
4. Carreira, Dinheiro e Oportunidades
5. Amor e Relacionamentos
6. Saúde Energética
7. Previsão do Próximo Ano
8. Tendências dos Próximos 5 Anos
9. Cores, Direções e Ambientes Favoráveis
10. Resposta à pergunta específica (se houver)
11. Conclusão emocional

Use uma linguagem acolhedora, empática e espiritual. Evite clichês e seja específico com base nas informações fornecidas. Inclua insights únicos sobre o caráter e o destino da pessoa.`;
  
  return prompt;
}

console.log('generateSajuReading function loaded');

// Helper functions for generating personalized content
function getRelationshipStage(stage) {
  const stages = {
    'solteiro': 'de solteiro(a)',
    'namorando': 'de relacionamento',
    'casado': 'de casado(a)',
    'separado': 'de separação',
    'viuvo': 'de viuvez'
  };
  return stages[stage] || 'relacional';
}

function getBestConnectionPeriod(element) {
  const periods = {
    'Madeira': 'abril a junho',
    'Fogo': 'julho a setembro',
    'Terra': 'março, junho, setembro e dezembro',
    'Metal': 'outubro a dezembro',
    'Água': 'janeiro a março'
  };
  return periods[element] || 'períodos estratégicos';
}

function getAnswerToQuestion(question, element) {
  // Simple keyword-based responses
  if (question.toLowerCase().includes('dinheiro') || question.toLowerCase().includes('carreira')) {
    return `Sua situação financeira melhorará significativamente nos próximos meses, especialmente quando você se alinhar com as energias do elemento ${element}. Foque em oportunidades práticas e evite investimentos de alto risco.`;
  } else if (question.toLowerCase().includes('amor') || question.toLowerCase().includes('relacionamento')) {
    return `No amor, é essencial manter sua natureza ${element === 'Terra' ? 'estável' : element === 'Fogo' ? 'apaixonada' : element === 'Água' ? 'compassiva' : element === 'Madeira' ? 'cuidadora' : 'justa'}. Comunicação honesta será fundamental.`;
  } else if (question.toLowerCase().includes('saúde')) {
    return `Sua saúde depende de manter o equilíbrio característico do elemento ${element}. Preste atenção especial aos órgãos associados e pratique atividades que harmonizem sua energia.`;
  } else {
    return `Os céus indicam que você deve seguir sua intuição ${element === 'Água' ? 'profunda' : element === 'Fogo' ? 'ardente' : element === 'Madeira' ? 'criativa' : element === 'Metal' ? 'clara' : 'prática'} neste assunto. O momento pede paciência e alinhamento com seus valores.`;
  }
}

function getElementWisdom(element) {
  const wisdom = {
    'Madeira': 'crescimento contínuo e renovação',
    'Fogo': 'transformação através da paixão',
    'Terra': 'nutrição e estabilidade',
    'Metal': 'clareza e refinamento',
    'Água': 'fluidez e sabedoria profunda'
  };
  return wisdom[element] || 'sabedoria ancestral';
}

// Email sending function
// Uses real email sending when config.email.enabled is true, otherwise simulates
async function sendEmail(to, subject, body) {
  console.log('=== EMAIL SENDING FUNCTION STARTED ===');
  console.log('Email details:', { to, subject, bodyLength: body.length });
  
  // Check if real email sending is enabled
  console.log('Step E1: Checking email configuration');
  console.log('Email config:', {
    enabled: config.email.enabled,
    hasSmtpHost: !!config.email.smtp.host,
    hasSmtpUser: !!config.email.smtp.auth.user,
    hasSmtpPass: !!config.email.smtp.auth.pass
  });
  
  if (config.email.enabled) {
    try {
      console.log('Step E2: Attempting to send real email');
      // Import nodemailer only when needed
      const nodemailer = require('nodemailer');
      
      // Create transporter with SMTP settings from config
      console.log('Step E3: Creating transporter');
      const transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.auth.user,
          pass: config.email.smtp.auth.pass
        }
      });
      
      console.log('Step E4: Transporter created, sending email');
      
      // Send real email
      const info = await transporter.sendMail({
        from: config.email.defaults.from,
        to: to,
        subject: subject,
        text: body
      });
      
      console.log('Step E5: Email sent successfully');
      console.log('📧 Email sent successfully:', info.messageId);
      console.log('=== EMAIL SENDING FUNCTION COMPLETED SUCCESSFULLY ===');
      return true;
    } catch (error) {
      console.error('Step E5 FAILED: Error sending email:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      console.log('=== EMAIL SENDING FUNCTION FAILED ===');
      return false;
    }
  } else {
    // Simulate email sending (current behavior)
    console.log('Step E2: Simulating email sending (config.email.enabled is false)');
    console.log(`📧 Simulating email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body.substring(0, 100)}...`);
    
    // Simulate a random success/failure for demonstration
    const result = Math.random() > 0.2; // 80% success rate
    console.log('Step E3: Simulated email result:', result);
    console.log('=== EMAIL SENDING FUNCTION COMPLETED (SIMULATED) ===');
    return result;
  }
}

// API endpoint for SaJu readings
app.post('/api/saju', async (req, res) => {
  console.log('=== NEW REQUEST TO /api/saju ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Body keys:', Object.keys(req.body));
  
  try {
    console.log('Step 1: Received request to /api/saju');
    
    // Log the incoming request data (excluding sensitive information)
    const { nome, email, sexo, data_nascimento } = req.body;
    console.log('Step 2: Request data extracted:', { 
      nome, 
      sexo, 
      data_nascimento, 
      email: email ? `${email.substring(0, 3)}...@${email.split('@')[1]}` : 'N/A' 
    });
    
    // Validate request
    console.log('Step 3: Starting request validation');
    const errors = validateRequest(req);
    
    if (errors.length > 0) {
      console.log('Step 3 FAILED: Validation errors:', errors);
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        errors: errors
      });
    }
    
    console.log('Step 3 PASSED: Validation passed');
    const userData = req.body;
    
    // Save lead to database (without storing the reading)
    console.log('Step 4: Saving lead to database');
    const insertQuery = `
      INSERT INTO leads 
      (nome, email, telefone, sexo, data_nascimento, estado_civil, pergunta, marketing_consent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    const values = [
      userData.nome,
      userData.email,
      userData.telefone || null,
      userData.sexo,
      userData.data_nascimento,
      userData.estado_civil || null,
      userData.pergunta || null,
      userData.marketing_consent
    ];
    
    try {
      console.log('Step 4: Attempting to save lead to database with values:', values.map((v, i) => `param${i+1}: ${v}`).join(', '));
      await pool.query(insertQuery, values);
      console.log('Step 4 PASSED: Lead saved successfully');
    } catch (err) {
      console.error('Step 4 FAILED: Database error:', err);
      // Don't fail the request if we can't save the lead
    }
    
    // Generate the reading
    console.log('Step 5: Generating SaJu reading');
    const leitura = await generateSajuReading(userData);
    console.log('Step 5 PASSED: Reading generated successfully, length:', leitura.length);
    
    // Send email (real or simulated based on config)
    console.log('Step 6: Sending email to:', userData.email);
    const emailSent = await sendEmail(
      userData.email,
      "Sua leitura da Mestra Aurora",
      leitura
    );
    console.log('Step 6 COMPLETE: Email sending result:', emailSent);
    
    // Return success response
    console.log('Step 7: Sending success response to client');
    res.json({
      success: true,
      leitura: leitura,
      email_sent: emailSent
    });
    console.log('Step 7 COMPLETE: Response sent successfully');
  } catch (error) {
    console.error('!!! CRITICAL ERROR: Error generating SaJu reading !!!');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      code: "INTERNAL_ERROR",
      message: "Erro interno ao gerar a leitura."
    });
  }
});

// API endpoint for contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate request
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios.'
      });
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'E-mail inválido.'
      });
    }
    
    // Prepare email content
    const emailSubject = `[Contato Mestra Aurora] ${subject}`;
    const emailBody = `
Nova mensagem de contato:

Nome: ${name}
E-mail: ${email}
Assunto: ${subject}

Mensagem:
${message}
`;
    
    // Send email to contact@mestraaurora.xyz
    const emailSent = await sendEmail(
      'contact@mestraaurora.xyz',
      emailSubject,
      emailBody
    );
    
    if (emailSent) {
      res.json({
        success: true,
        message: 'Mensagem enviada com sucesso!'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar mensagem. Por favor, tente novamente.'
      });
    }
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno ao enviar mensagem.'
    });
  }
});

// Start the server
// Add a small delay to ensure database connection is established
setTimeout(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📄 Acesse http://localhost:${PORT} para usar o aplicativo`);
    
    // Show email configuration status
    if (config.email.enabled) {
      console.log(`📧 Email sending: ENABLED (${config.email.smtp.host}:${config.email.smtp.port})`);
    } else {
      console.log(`📧 Email sending: SIMULATED (set config.email.enabled=true to enable real sending)`);
    }
  });
}, 1000); // Wait 1 second before starting the server

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});