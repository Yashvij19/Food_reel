/**
 * Script to generate RSA key pair for JWT signing
 * Run: node scripts/generate-jwt-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateKeyPair() {
  console.log('Generating RSA key pair for JWT signing...\n');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Output for .env file
  console.log('Add these to your .env file:\n');
  console.log('JWT_PRIVATE_KEY="' + privateKey.replace(/\n/g, '\\n') + '"');
  console.log('\n');
  console.log('JWT_PUBLIC_KEY="' + publicKey.replace(/\n/g, '\\n') + '"');

  // Also save to files for reference
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
  fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

  console.log('\n\nKeys also saved to:');
  console.log(`  - ${path.join(keysDir, 'private.pem')}`);
  console.log(`  - ${path.join(keysDir, 'public.pem')}`);
  console.log('\n⚠️  Keep private.pem secure and never commit to version control!');
}

generateKeyPair();