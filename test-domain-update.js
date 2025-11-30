const axios = require('axios');

// Test data for contact form
const testData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  subject: 'Test Domain Update',
  message: 'This is a test message to verify the new domain settings.'
};

console.log('Testing contact form with new domain settings...');
console.log('Sending data:', testData);

axios.post('http://localhost:3001/api/contact', testData)
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  })
  .catch(error => {
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  });