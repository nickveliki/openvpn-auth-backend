const push = require("web-push");
const fs = require("fs")
if (!fs.existsSync('./htdocs/vapidpublic')&&!fs.existsSync('./.vapidprivate')){
    console.log("generating VAPID key files")
    const {publicKey, privateKey} = push.generateVAPIDKeys();
    fs.writeFileSync('./htdocs/vapidpublic', publicKey);
    fs.writeFileSync('./.vapidprivate', privateKey);
}
push.setVapidDetails('mailto:phil@thern.wtf', fs.readFileSync('./htdocs/vapidpublic').toString(), fs.readFileSync('./.vapidprivate').toString());
const pushMessage = ({subscription, message})=>new Promise((res, rej)=>{
    push.sendNotification(subscription, message).then(res, ()=>{
        rej({error: 500, message:"push error"})
    })
})
module.exports = {
    pushMessage
}