/**
 * Test OpenAI API Connection
 * Run: npm run test:openai
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env.local manually (no dotenv dependency)
const envPath = path.join(__dirname, '..', '.env.local');
let API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/OPENAI_API_KEY\s*=\s*(.+)/);
  if (match) {
    API_KEY = match[1].trim().replace(/['"]/g, '');
  }
}

console.log('\n🔍 OpenAI Connection Diagnostics\n');
console.log('═'.repeat(50));

// Test 1: API Key Check
console.log('\n1️⃣ Checking API Key...');
if (!API_KEY) {
  console.error('❌ OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}
console.log('✅ API key found:', API_KEY.substring(0, 20) + '...');

// Test 2: Network connectivity to api.openai.com
console.log('\n2️⃣ Testing network connectivity to api.openai.com...');
const dnsTest = new Promise((resolve, reject) => {
  require('dns').lookup('api.openai.com', (err, address) => {
    if (err) {
      console.error('❌ DNS lookup failed:', err.message);
      reject(err);
    } else {
      console.log('✅ DNS resolved:', address);
      resolve(address);
    }
  });
});

// Test 3: HTTPS connection
console.log('\n3️⃣ Testing HTTPS connection...');
const httpsTest = new Promise((resolve, reject) => {
  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/models',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    timeout: 10000, // 10 second timeout
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ HTTPS connection successful');
        console.log('✅ API key is valid');
        resolve(data);
      } else if (res.statusCode === 401) {
        console.error('❌ Invalid API key (401 Unauthorized)');
        reject(new Error('Invalid API key'));
      } else {
        console.error(`❌ HTTP ${res.statusCode}:`, data.substring(0, 200));
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
    if (err.message.includes('ETIMEDOUT') || err.message.includes('timeout')) {
      console.error('\n⚠️  DIAGNOSIS: Connection timed out');
      console.error('   Possible causes:');
      console.error('   - Firewall blocking api.openai.com');
      console.error('   - VPN interfering with connection');
      console.error('   - Slow/unstable internet connection');
      console.error('   - Corporate proxy blocking requests');
    }
    reject(err);
  });

  req.on('timeout', () => {
    console.error('❌ Request timed out after 10 seconds');
    req.destroy();
    reject(new Error('Connection timeout'));
  });

  req.end();
});

// Test 4: Simple completion
console.log('\n4️⃣ Testing simple AI completion...');
const completionTest = new Promise((resolve, reject) => {
  const postData = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Say "test successful"' }],
    max_tokens: 10,
  });

  const options = {
    hostname: 'api.openai.com',
    port: 443,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: 30000, // 30 second timeout
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          const reply = result.choices[0]?.message?.content;
          console.log('✅ AI completion successful');
          console.log('✅ Response:', reply);
          resolve(result);
        } catch (err) {
          console.error('❌ Failed to parse response:', err.message);
          reject(err);
        }
      } else {
        console.error(`❌ HTTP ${res.statusCode}:`, data.substring(0, 300));
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Completion request error:', err.message);
    reject(err);
  });

  req.on('timeout', () => {
    console.error('❌ Completion request timed out');
    req.destroy();
    reject(new Error('Completion timeout'));
  });

  req.write(postData);
  req.end();
});

// Run all tests
(async () => {
  try {
    await dnsTest;
    await httpsTest;
    await completionTest;
    
    console.log('\n' + '═'.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('✅ Your OpenAI connection is working correctly');
    console.log('═'.repeat(50) + '\n');
    
    console.log('💡 If your app still has timeout issues:');
    console.log('   1. Restart your dev server: rm -rf .next && npm run dev');
    console.log('   2. Check if your prompt is too large (>100k characters)');
    console.log('   3. Try a different network/disable VPN\n');
    
  } catch (err) {
    console.log('\n' + '═'.repeat(50));
    console.log('❌ TESTS FAILED');
    console.log('═'.repeat(50) + '\n');
    
    console.log('🔧 TROUBLESHOOTING STEPS:\n');
    console.log('1. Check .env.local file:');
    console.log('   - File exists in project root');
    console.log('   - Contains: OPENAI_API_KEY=sk-proj-...');
    console.log('   - API key is valid (check at platform.openai.com)\n');
    
    console.log('2. Network issues:');
    console.log('   - Disable VPN and try again');
    console.log('   - Check firewall settings');
    console.log('   - Try: curl https://api.openai.com/v1/models\n');
    
    console.log('3. Windows-specific:');
    console.log('   - Check antivirus/Windows Defender');
    console.log('   - Check Windows Firewall settings');
    console.log('   - Try running PowerShell as Administrator\n');
    
    process.exit(1);
  }
})();
