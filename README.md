# Mestra Aurora – Leitura do Destino Coreano

## Descrição do Projeto

Este projeto implementa uma aplicação completa de leitura de destino coreano (SaJu) composta por frontend e backend. Os usuários preenchem um formulário com informações pessoais e recebem uma leitura personalizada gerada por IA, que é exibida imediatamente na tela, enviada por e-mail e armazenada como lead no banco de dados.

## Funcionalidades

### Frontend
- Formulário responsivo com validação em tempo real
- Campos obrigatórios: nome, sexo, data de nascimento, e-mail
- Campos opcionais: tipo de calendário, hora de nascimento, estado civil, tempo de relacionamento, pergunta específica, telefone, consentimento de marketing
- Experiência de usuário otimizada com feedback visual durante o processamento
- Design moderno com tema escuro e elementos visuais atrativos

### Backend
- API RESTful para processamento de formulários
- Validação de dados com mensagens de erro detalhadas
- Geração de leituras personalizadas de SaJu usando algoritmo baseado em inteligência artificial
- Envio de e-mails com as leituras
- Armazenamento de leads em banco de dados SQLite
- Tratamento de erros e logging

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Banco de Dados**: SQLite
- **Validação**: Express Validator
- **Envio de E-mails**: Nodemailer (simulado nesta implementação)

## Estrutura do Projeto

```
├── index.html          # Página principal do frontend
├── server.js           # Servidor backend e API
├── leads.db            # Banco de dados SQLite para leads
├── package.json        # Dependências e scripts do projeto
└── README.md           # Documentação
```

## Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor**:
   ```bash
   npm start
   ```
   
   Ou em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

3. **Acessar a aplicação**:
   Abra seu navegador e acesse `http://localhost:3001`

## API Endpoints

### POST /api/saju
Gera uma leitura de SaJu personalizada com base nos dados do usuário.

**Request Body**:
```json
{
  "nome": "string (obrigatório)",
  "sexo": "string (obrigatório) - 'masculino' ou 'feminino'",
  "data_nascimento": "string (obrigatório) - formato YYYY-MM-DD",
  "email": "string (obrigatório) - formato de e-mail válido",
  "tipo_calendario": "string (opcional) - 'solar' ou 'lunar'",
  "hora_nascimento": "string (opcional) - formato HH:MM",
  "estado_civil": "string (opcional)",
  "tempo_relacionamento": "string (opcional)",
  "pergunta": "string (opcional)",
  "telefone": "string (opcional)",
  "marketing_consent": "boolean (opcional)"
}
```

**Response Success**:
```json
{
  "success": true,
  "leitura": "Texto da leitura gerada",
  "email_sent": true
}
```

**Response Error**:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR | INTERNAL_ERROR",
  "message": "Mensagem de erro",
  "errors": ["Array de erros de validação"]
}
```

## Banco de Dados

O projeto utiliza SQLite para armazenar leads. A tabela `leads` contém os seguintes campos:

- `id`: Identificador único (auto-incremento)
- `nome`: Nome do usuário
- `email`: E-mail do usuário (não único - o mesmo e-mail pode submeter várias leituras)
- `telefone`: Telefone do usuário (opcional)
- `sexo`: Sexo do usuário
- `data_nascimento`: Data de nascimento
- `estado_civil`: Estado civil (opcional)
- `pergunta`: Pergunta específica (opcional)
- `marketing_consent`: Consentimento para marketing
- `created_at`: Data de criação do registro

Importante: A leitura gerada pela IA NÃO é armazenada no banco de dados. Apenas os dados da lead são guardados para fins de acompanhamento e análise.

## Personalização

### Modificando o Algoritmo de Geração de Leituras
O algoritmo de geração de leituras está localizado na função `generateSajuReading` no arquivo `server.js`. Você pode personalizar os textos, adicionar mais seções ou modificar a lógica de geração de conteúdo.

### Alterando o Envio de E-mails

A função `sendEmail` no arquivo `server.js` suporta tanto o envio simulado quanto o envio real de e-mails, controlado pelo arquivo de configuração.

Para habilitar o envio real de e-mails:

1. Copie o arquivo `config.example.js` para `config.js`:
   ```bash
   cp config.example.js config.js
   ```

2. (Opcional) Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```

3. Edite `config.js` e defina `email.enabled` como `true`

4. Configure as credenciais SMTP no mesmo arquivo ou usando variáveis de ambiente:
   ```javascript
   email: {
     enabled: true,  // Mude para true para habilitar envio real
     smtp: {
       host: process.env.SMTP_HOST || 'smtp.mailersend.net',
       port: process.env.SMTP_PORT || 587,
       secure: process.env.SMTP_SECURE === 'true' || false,
       auth: {
         user: process.env.SMTP_USER || 'SEU_USUARIO_MAILERSEND_PARA_mestraaurora.xyz',
         pass: process.env.SMTP_PASS || 'SUA_SENHA_MAILERSEND_PARA_mestraaurora.xyz'
       }
     },
     defaults: {
       from: process.env.EMAIL_FROM || '"Mestra Aurora" <noreply@mestraaurora.xyz>'
     }
   }
   ```

5. Para usar seu domínio personalizado `mestraaurora.xyz`:
   - Acesse sua conta MailerSend
   - Adicione o domínio `mestraaurora.xyz`
   - Configure os registros DNS necessários (SPF, DKIM, DMARC)
   - Verifique o domínio conforme instruções da MailerSend
   - Obtenha as credenciais SMTP para o domínio

O sistema usará automaticamente as configurações do arquivo `config.js` quando o servidor for iniciado. Se variáveis de ambiente estiverem definidas, elas terão precedência sobre os valores padrão no arquivo de configuração.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto é licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

Mestra Aurora - [contact@mestraaurora.xyz](mailto:contact@mestraaurora.xyz)

Link do Projeto: [https://github.com/seu-usuario/mestra-aurora](https://github.com/seu-usuario/mestra-aurora)