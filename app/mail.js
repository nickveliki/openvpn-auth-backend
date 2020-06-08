const mailer = require("nodemailer");
const transport = mailer.createTransport(require("../mailconf.json"));
module.exports = (to, subject, message, html)=>transport.sendMail({
    from:"Dramatrix <phil@thern.wtf>",
    to,
    subject,
    text:html?undefined:message,
    html:html?message:undefined
})
