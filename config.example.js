// Example configuration file for Mestra Aurora application
// Copy this file to config.js and update with your own credentials

module.exports = {
  // Email configuration
  email: {
    // Set to true to enable real email sending, false to keep simulation
    enabled: false,
    
    // SMTP settings (only used if enabled: true)
    smtp: {
      host: 'smtp.your-email-provider.com',  // e.g., 'smtp.gmail.com' for Gmail
      port: 587,                             // Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
      secure: false,                         // true for 465, false for other ports
      auth: {
        user: 'your-email@your-domain.com',
        pass: 'your-app-password-or-api-key'
      }
    },
    
    // Email defaults
    defaults: {
      from: '"Mestra Aurora" <noreply@your-domain.com>'
    }
  },
  
  // AI Service configuration (for future GPT integration)
  aiService: {
    // API endpoint for AI service
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    
    // API key for authentication
    apiKey: 'your-openai-api-key-here',
    
    // Default model to use
    model: 'gpt-3.5-turbo'
  },
  
  // Database configuration
  database: {
    filename: 'leads.db'
  },
  
  // Server configuration
  server: {
    port: 3001
  }
};