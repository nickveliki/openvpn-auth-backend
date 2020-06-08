const jables = require("./app/jableshandler");
const {username, password} = process.env;
try{
    jables.login({name: username, password}).then((user)=>{
        return 0;
    }, (error)=>{
        throw error;
})
}catch(e){
    throw e;
}

