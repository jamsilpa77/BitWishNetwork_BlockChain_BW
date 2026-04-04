const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_DIR = path.join(__dirname, 'database', 'users');
const PASSWORD = '@Love-1106@';
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
}

function generateHash(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex');
}

const initialUsers = [
    {
        owner: "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
        code: "REF9F5FF0909DC5",
        referrerId: null,
        referees: [
            "BW958ACBEA657953450332FFF0FD66ABB0FA994005",
            "BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6",
            "BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8"
        ],
        joinedAt: "2025-12-24T13:25:39.365Z",
        rewardStorage: 3.0,
        bonusStorage: 0.0,
        kycStatus: "APPROVED" // Admin is approved
    },
    {
        owner: "BW958ACBEA657953450332FFF0FD66ABB0FA994005",
        code: "REF958ACBEAA994005",
        referrerId: "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
        referees: ["BWD6CCB861E43DA7B213B9871CEC8C49E0F17577E5"],
        joinedAt: "2025-12-28T10:00:00.000Z",
        rewardStorage: 1.0,
        bonusStorage: 0.0,
        kycStatus: "PENDING"
    },
    {
        owner: "BW69527012159E5A3CF2EFB3E07D8DC7FCFA385EF6",
        code: "REF69527012385EF6",
        referrerId: "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
        referees: [],
        joinedAt: "2025-12-28T10:00:00.000Z",
        rewardStorage: 1.0,
        bonusStorage: 0.0,
        kycStatus: "PENDING"
    },
    {
        owner: "BW6330A20CAFA9EF6F0203DE34F8C3E3F076C9B0E8",
        code: "REFCT646TAFRWPM",
        referrerId: "BW9F5FF090231236037F250A523B4FC320FB44BFA8",
        referees: [],
        joinedAt: "2025-12-24T13:25:39.367Z",
        rewardStorage: 1.0,
        bonusStorage: 0.0,
        kycStatus: "PENDING"
    },
    {
        owner: "BWD6CCB861E43DA7B213B9871CEC8C49E0F17577E5",
        code: "REFD6CCB8617577E5",
        referrerId: "BW958ACBEA657953450332FFF0FD66ABB0FA994005",
        referees: [],
        joinedAt: "2025-12-28T10:00:00.000Z",
        rewardStorage: 1.0,
        bonusStorage: 0.0,
        kycStatus: "PENDING"
    }
];

initialUsers.forEach(user => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = generateHash(PASSWORD, salt);
    user.secondPasswordHash = `${salt}:${hash}`;

    const filePath = path.join(USERS_DIR, `${user.owner.toUpperCase()}.json`);
    fs.writeFileSync(filePath, JSON.stringify(user, null, 2), 'utf8');
    console.log(`✅ File created: ${filePath}`);
});
