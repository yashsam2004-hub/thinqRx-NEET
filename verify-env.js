/**
 * Verify Environment Variables
 * Run this to check what Vercel will see
 */

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log('         Environment Variables Verification');
console.log('═══════════════════════════════════════════════════════════\n');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
  
  console.log('📋 Local .env.local Configuration:\n');
  
  // OpenAI Settings
  console.log('🤖 OpenAI Configuration:');
  console.log(`   OPENAI_API_KEY: ${envVars.OPENAI_API_KEY ? envVars.OPENAI_API_KEY.slice(0, 20) + '...' + envVars.OPENAI_API_KEY.slice(-4) : '❌ MISSING'}`);
  console.log(`   OPENAI_MODEL: ${envVars.OPENAI_MODEL || '❌ MISSING (will default to gpt-4o-mini)'}`);
  console.log('');
  
  // Supabase Settings
  console.log('🗄️  Supabase Configuration:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20) + '...' : '❌ MISSING'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : '❌ MISSING'}`);
  console.log('');
  
  // Redis Settings
  console.log('🔴 Redis Configuration:');
  console.log(`   UPSTASH_REDIS_REST_URL: ${envVars.UPSTASH_REDIS_REST_URL || '❌ MISSING'}`);
  console.log(`   UPSTASH_REDIS_REST_TOKEN: ${envVars.UPSTASH_REDIS_REST_TOKEN ? 'SET' : '❌ MISSING'}`);
  console.log('');
  
  // Admin Settings
  console.log('👤 Admin Configuration:');
  console.log(`   ADMIN_EMAIL_ALLOWLIST: ${envVars.ADMIN_EMAIL_ALLOWLIST || 'Not set'}`);
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('         Vercel Environment Variables Checklist');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('✅ Make sure these EXACT values are in Vercel:\n');
  
  const criticalVars = [
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ];
  
  criticalVars.forEach(key => {
    if (envVars[key]) {
      if (key.includes('KEY') || key.includes('TOKEN')) {
        console.log(`${key}=${envVars[key].slice(0, 30)}... (masked)`);
      } else {
        console.log(`${key}=${envVars[key]}`);
      }
    } else {
      console.log(`${key}=❌ MISSING IN LOCAL`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    Important Notes');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!envVars.OPENAI_MODEL) {
    console.log('⚠️  OPENAI_MODEL is not set in .env.local');
    console.log('   This means it will default to "gpt-4o-mini"');
    console.log('   If you want gpt-5-mini, you MUST set it explicitly');
  } else if (envVars.OPENAI_MODEL === 'gpt-5-mini') {
    console.log('✅ OPENAI_MODEL is set to gpt-5-mini');
    console.log('   Make sure Vercel has the SAME value!');
  } else {
    console.log(`✅ OPENAI_MODEL is set to: ${envVars.OPENAI_MODEL}`);
  }
  
  console.log('\n📝 Copy these to Vercel if not already there:\n');
  console.log('   1. Go to: https://vercel.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Add/Update each variable above');
  console.log('   5. Make sure they match your local values EXACTLY');
  console.log('   6. Redeploy after any changes\n');
  
} else {
  console.error('❌ .env.local file not found!');
  console.error('   Path checked:', envPath);
}
