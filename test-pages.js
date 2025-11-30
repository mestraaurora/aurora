const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  'index.html',
  'terms.html',
  'privacy-policy.html',
  'contact.html',
  'server.js'
];

console.log('Checking required files...');

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} is missing`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('\n🎉 All required files are present!');
  console.log('You can now access the website at http://localhost:3001');
  console.log('- Main page: http://localhost:3001/');
  console.log('- Terms: http://localhost:3001/terms.html');
  console.log('- Privacy Policy: http://localhost:3001/privacy-policy.html');
  console.log('- Contact: http://localhost:3001/contact.html');
} else {
  console.log('\n❌ Some files are missing. Please check the file structure.');
}