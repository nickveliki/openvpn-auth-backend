const jables = require("./app/jableshandler");
const {username, password} = process.env;
jables.login({name: "nickveliki", password: "54726f6c6c"}).then((user)=>{
        return 0;
    }, (error)=>{
        throw error;
})

