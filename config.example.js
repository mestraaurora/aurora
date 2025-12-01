// Example configuration file for Mestra Aurora application
// Copy this file to config.js and update with your own credentials

module.exports = {
  // Email configuration
  email: {
    // Set to true to enable real email sending, false to keep simulation
    enabled: true,
    
    // SMTP settings (only used if enabled: true)
    smtp: {
      host: 'smtp.mailersend.net',  // MailerSend SMTP host
      port: 587,                             // MailerSend port
      secure: false,                         // false for port 587
      auth: {
        user: 'YOUR_MAILERSEND_USERNAME_FOR_mestraaurora.xyz',
        pass: 'YOUR_MAILERSEND_PASSWORD_FOR_mestraaurora.xyz'
      }
    },
    
    // Email defaults
    defaults: {
      from: '"Mestra Aurora" <noreply@mestraaurora.xyz>'
    }
  },
  
  // AI Service configuration (for future GPT integration)
  aiService: {
    // API endpoint for AI service
    apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
    
    // API key for authentication
    apiKey: 'your-openrouter-api-key-here',
    
    // Default model to use
    model: 'x-ai/grok-4.1-fast:free'
  },
  
  // Database configuration
  database: {
    url: 'postgresql://username:password@host:port/database'
  },
  
  // Server configuration
  server: {
    port: 3001
  }
};