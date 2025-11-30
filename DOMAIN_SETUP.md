# Configuração de Domínio para Mestra Aurora

## Domínio Principal
- **Domínio**: mestraaurora.xyz
- **Email de envio**: noreply@mestraaurora.xyz
- **Email de contato**: contact@mestraaurora.xyz

## Configuração MailerSend

### Passos Necessários:
1. Acesse sua conta MailerSend
2. Adicione o domínio `mestraaurora.xyz`
3. Configure os registros DNS:
   - SPF
   - DKIM
   - DMARC
4. Verifique o domínio conforme instruções da MailerSend
5. Obtenha as credenciais SMTP para o domínio

### Credenciais SMTP (a serem obtidas no MailerSend):
- **Host**: smtp.mailersend.net
- **Porta**: 587
- **Usuário**: [Obtido no painel MailerSend]
- **Senha**: [Obtida no painel MailerSend]

### Configuração em config.js:
```javascript
email: {
  enabled: true,
  smtp: {
    host: 'smtp.mailersend.net',
    port: 587,
    secure: false,
    auth: {
      user: 'SEU_USUARIO_OBTIDO_NO_MAILERSEND',
      pass: 'SUA_SENHA_OBTIDA_NO_MAILERSEND'
    }
  },
  defaults: {
    from: '"Mestra Aurora" <noreply@mestraaurora.xyz>'
  }
}
```

## Importante
- As credenciais SMTP NÃO devem ser versionadas no GitHub
- Use variáveis de ambiente para configurar as credenciais em produção
- Após configurar, teste o envio de emails para garantir funcionamento correto