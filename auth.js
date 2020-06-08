const jables = require("./app/jableshandler");
const {username, password} = process.env;
jables.login({name: username, password}).then((user)=>{
    jables.logEntry(`${user.name}/${user.uid} logged on to VPN server`).then(()=>{
        return;
    })
}, (error)=>{
    jables.logEntry(`${process.env.username} failed login to VPN server`).then(()=>{
        throw error;
    })
})