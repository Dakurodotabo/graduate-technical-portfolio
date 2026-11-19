const bcrypt = require('bcryptjs');

async function generateHashes() {
  const passwords = ['password', 'admin'];
  for (const pwd of passwords) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(pwd, salt);
    console.log(`Password: ${pwd}`);
    console.log(`Hash: ${hash}`);
  }
}

generateHashes();
