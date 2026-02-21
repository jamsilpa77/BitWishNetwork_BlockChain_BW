const crypto = require('crypto');

const password = '@Love-1106@';
const salt = crypto.randomBytes(16).toString('hex');
const iterations = 100000;
const keyLength = 64;
const digest = 'sha512';

const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');
console.log(`${salt}:${hash}`);
