const jables = require("./app/jableshandler");
jables.login(process.env).then(()=>{
    return;
}, (error)=>{
    throw error;
})