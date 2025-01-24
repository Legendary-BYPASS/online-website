const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 20
});

app.use('/api/validate', limiter);

const dataPath = path.join(__dirname, '../hwidDatabase.json');
let hwidDatabase = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { hwid } = req.body;
    for (const pc in hwidDatabase) {
        if (hwidDatabase[pc].hwid === hwid) {
            let expiryDate = new Date(hwidDatabase[pc].expires);
            let today = new Date();
            
            if (today > expiryDate) {
                delete hwidDatabase[pc];
                fs.writeFileSync(dataPath, JSON.stringify(hwidDatabase, null, 2));
                return res.status(403).json({ valid: false, message: "Expired" });
            }

            return res.status(200).json({ valid: true, expires: hwidDatabase[pc].expires });
        }
    }
    res.status(404).json({ valid: false, message: "HWID not found" });
}
