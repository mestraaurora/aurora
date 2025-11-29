const axios = require('axios');

// Test data
const testData = {
  nome: "Maria Silva",
  sexo: "feminino",
  data_nascimento: "1990-05-15",
  email: "maria.silva@example.com",
  tipo_calendario: "solar",
  hora_nascimento: "14:30",
  estado_civil: "solteiro",
  tempo_relacionamento: "2 anos",
  pergunta: "Qual é o meu propósito de vida?",
  telefone: "+55 11 99999-9999",
  marketing_consent: true
};

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    console.log('Sending data:', testData);
    
    const response = await axios.post('http://localhost:3001/api/saju', testData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', {
      success: response.data.success,
      email_sent: response.data.email_sent,
      leitura_preview: response.data.leitura.substring(0, 200) + '...'
    });
    
    console.log('✅ API test completed successfully!');
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('❌ No response received:', error.request);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAPI();