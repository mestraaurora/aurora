const dns = require('dns').promises;

async function testDNS() {
  const hostname = 'dpg-d4mmh0fdiees739br8u0-a';
  
  try {
    console.log(`Testing DNS resolution for ${hostname}...`);
    const addresses = await dns.resolve(hostname);
    console.log(`✅ DNS resolution successful:`, addresses);
  } catch (error) {
    console.error(`❌ DNS resolution failed for ${hostname}:`, error.message);
    
    // Try alternative approaches
    console.log('Trying alternative DNS resolution methods...');
    
    try {
      const addresses4 = await dns.resolve4(hostname);
      console.log(`✅ IPv4 resolution successful:`, addresses4);
    } catch (error4) {
      console.error(`❌ IPv4 resolution failed:`, error4.message);
    }
    
    try {
      const addresses6 = await dns.resolve6(hostname);
      console.log(`✅ IPv6 resolution successful:`, addresses6);
    } catch (error6) {
      console.error(`❌ IPv6 resolution failed:`, error6.message);
    }
  }
  
  // Also test with the full database URL format
  const fullHostname = 'dpg-d4mmh0fdiees739br8u0-a.oregon-postgres.render.com';
  console.log(`\nTesting DNS resolution for Render format: ${fullHostname}...`);
  
  try {
    const addresses = await dns.resolve(fullHostname);
    console.log(`✅ Render format DNS resolution successful:`, addresses);
  } catch (error) {
    console.error(`❌ Render format DNS resolution failed:`, error.message);
  }
}

testDNS();