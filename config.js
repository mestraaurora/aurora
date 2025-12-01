module.exports = {
  // Email configuration
  email: {
    // Set to true to enable real email sending, false to keep simulation
    enabled: false,
    
    // SMTP settings (only used if enabled: true)
    smtp: {
      host: 'smtp.mailersend.net',  // MailerSend SMTP host
      port: 587,                             // MailerSend port
      secure: false,                         // false for port 587
      auth: {
        user: process.env.SMTP_USER || 'YOUR_MAILERSEND_USERNAME_FOR_mestraaurora.xyz',
        pass: process.env.SMTP_PASS || 'YOUR_MAILERSEND_PASSWORD_FOR_mestraaurora.xyz'
      }
    },
    
    // Email defaults
    defaults: {
      from: process.env.EMAIL_FROM || '"Mestra Aurora" <noreply@mestraaurora.xyz>'
    }
  },
  
  // AI Service configuration (for future GPT integration)
  aiService: {
    // API endpoint for AI service
    apiUrl: process.env.AI_SERVICE_URL || 'https://openrouter.ai/api/v1/chat/completions',
    
    // API key for authentication
    apiKey: process.env.AI_SERVICE_API_KEY || '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',
    
    // Default model to use
    model: process.env.AI_SERVICE_MODEL || 'x-ai/grok-4.1-fast:free'
  },
  
  // Database configuration - Updated to use Render Postgres with correct format
  database: {
    url: process.env.DATABASE_URL || 'postgresql://mestraaurora_user:g3S0BXkKABLP2A9A6Yf630F5Um6CbY42@dpg-d4mmh0fdiees739br8u0-a.oregon-postgres.render.com/mestraaurora'
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 3001
  }
};