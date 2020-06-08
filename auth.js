const jables = require("./app/jableshandler");
jables.login(process.env).then((user)=>{
    jables.logEntry(`${user.name}/${user.uid} logged on to VPN server`)
    return;
}, (error)=>{
    jables.logEntry(`${process.env.name} failed login to VPN server`)
    throw error;
})