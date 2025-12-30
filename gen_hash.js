const crypto = require('crypto');

function generateHash(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = generateHash('123456', salt);
console.log(`${salt}:${hash}`);
