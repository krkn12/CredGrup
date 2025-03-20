const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [{ name: 'commonName', value: 'localhost' }];
selfsigned.generate(attrs, { days: 365 }, (err, pems) => {
  if (err) throw err;
  fs.writeFileSync(path.join(__dirname, 'ssl', 'private-key.pem'), pems.private);
  fs.writeFileSync(path.join(__dirname, 'ssl', 'certificate.pem'), pems.cert);
  console.log('Certificados gerados em ssl/');
});