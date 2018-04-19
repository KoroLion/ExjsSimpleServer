const fs = require('fs');
const http = require('http');
const https = require('https');

const express = require('express');

module.exports = {
    startServer: function (args) {
        const HTTP_PORT = args.httpPort? args.httpPort: 80;
        const HTTPS_PORT = args.httpsPort? args.httpsPort: 443;
        const SSL_KEY_FILE = args.sslKeyFile? args.sslKeyFile: null;
        const SSL_CERT_FILE = args.sslCertFile? args.sslCertFile: null;
        const HTTP_REDIRECT = args.httpRedirect? args.httpRedirect: false;

        let httpsEnabled = false;
        let sslCredentials = null;
        if (HTTPS_PORT && SSL_KEY_FILE && SSL_CERT_FILE) {
            if (fs.existsSync(SSL_KEY_FILE) && fs.existsSync(SSL_CERT_FILE)) {
                sslCredentials = {
                    key: fs.readFileSync(SSL_KEY_FILE),
                    cert: fs.readFileSync(SSL_CERT_FILE)
                };
                httpsEnabled = true;
            }
            else
                console.log('ERROR: Unable to locate ssl cert and/or key!')
        }

        const redirectApp = express();
        const app = express();

        redirectApp.get('*', function (req, res) {
            res.redirect(307, 'https://' + req.headers.host.split(':')[0] + ':' + HTTPS_PORT + req.url);
        });
        app.use('/', express.static('client'));

        const httpServer = (HTTP_REDIRECT && httpsEnabled)? http.createServer(redirectApp): http.createServer(app);
        httpServer.listen(HTTP_PORT, function () {
            console.log('HTTP server started on port %d', HTTP_PORT);
        });

        if (httpsEnabled) {
            const httpsServer = https.createServer(sslCredentials, app);
            httpsServer.listen(HTTPS_PORT, function () {
                console.log('HTTPS server started on port %d', HTTPS_PORT);
            });
            return httpsServer;
        }
        else
            return httpServer;
    }
}
