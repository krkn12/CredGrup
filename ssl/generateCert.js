const { generateKeyPairSync } = require('crypto');
const { writeFileSync } = require('fs');
const path = require('path');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

writeFileSync(path.join(__dirname, 'ssl/private-key.pem'), privateKey.export({ type: 'pkcs1', format: 'pem' }));
writeFileSync(path.join(__dirname, 'ssl/certificate.pem'), publicKey.export({ type: 'spki', format: 'pem' }));
console.log('Certificados gerados em ssl/');