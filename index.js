const https = require("https");
const app = require("./app/app");
const fs = require("fs");
const server = https.createServer({
    //replace exampledomain with the location of the certificates you are using
    key: fs.readFileSync("/etc/letsencrypt/live/exampledomain.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/exampledomain.com/fullchain.pem")
},app)
server.listen(443);
