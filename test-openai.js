/**
 * OpenAI API Test Script
 * Run this to diagnose GPT-5 mini access issues
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function testOpenAI() {
  console.log('🔍 Testing OpenAI API Configuration\n');
  
  // 1. Check environment variables
  console.log('1️⃣ Environment Variables:');
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  console.log(`   ✅ API Key: ${apiKey.slice(0, 20)}...${apiKey.slice(-4)}`);
  console.log(`   ✅ Model: ${model}\n`);
  
  // 2. Initialize OpenAI client
  console.log('2️⃣ Initializing OpenAI Client...');
  const client = new OpenAI({ apiKey });
  console.log('   ✅ Client created\n');
  
  // 3. Test API connection with models list
  console.log('3️⃣ Testing API Connection...');
  try {
    const models = await client.models.list();
    console.log('   ✅ API connection successful');
    
    // Check if GPT-5 mini is available
    const availableModels = [];
    for await (const model of models) {
      if (model.id.includes('gpt-5') || model.id.includes('gpt-4o')) {
        availableModels.push(model.id);
      }
    }
    
    console.log(`   📋 Available GPT models: ${availableModels.slice(0, 5).join(', ')}...\n`);
    
    const hasGPT5Mini = availableModels.some(m => m.includes('gpt-5-mini'));
    if (hasGPT5Mini) {
      console.log('   ✅ gpt-5-mini is available!\n');
    } else {
      console.log('   ⚠️ gpt-5-mini not found in available models');
      console.log('   💡 Your API key may be on Free tier (GPT-5 requires Tier 1+)\n');
    }
  } catch (error) {
    console.error('   ❌ API connection failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  }
  
  // 4. Test actual completion with specified model
  console.log(`4️⃣ Testing Completion with ${model}...`);
  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "Test successful!" in JSON format: {"result": "..."}' }
      ],
      response_format: { type: 'json_object' },
      ...(model.startsWith('gpt-5') 
        ? { max_completion_tokens: 50 } // GPT-5: no temperature, use max_completion_tokens
        : { max_tokens: 50, temperature: 0.7 }), // Other models: support temperature and max_tokens
    });
    
    console.log('   ✅ Completion successful!');
    console.log('   📝 Response:', completion.choices[0].message.content);
    console.log('   💰 Tokens used:', completion.usage.total_tokens);
    console.log('\n✅ ALL TESTS PASSED! Your OpenAI setup is working correctly.\n');
    
  } catch (error) {
    console.error('   ❌ Completion failed!');
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
    
    if (error.message.includes('model')) {
      console.error('\n🚨 MODEL ACCESS ERROR:');
      console.error('   The model you specified is not accessible with your API key.');
      console.error('\n   Possible causes:');
      console.error('   1. Free tier API key (GPT-5 models require Tier 1+)');
      console.error('   2. Model name typo');
      console.error('   3. Model not yet available in your region');
      console.error('\n   Solutions:');
      console.error('   - Add $5+ credits to OpenAI account to unlock Tier 1');
      console.error('   - OR change OPENAI_MODEL to "gpt-4o-mini" in .env.local');
    }
    
    if (error.status) {
      console.error('   HTTP Status:', error.status);
    }
    
    console.error('\n   Full error object:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('              OpenAI API Diagnostic Test');
console.log('═══════════════════════════════════════════════════════════\n');

testOpenAI().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
