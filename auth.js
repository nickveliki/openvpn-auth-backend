const jables = require("./app/jableshandler");
const {username, password} = process.env;
jables.login({name: username, password}).then((user)=>{
        return 0;
    }, (error)=>{
        throw error;
})

