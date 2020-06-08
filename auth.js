const jables = require("./app/jableshandler");
const {username, password} = process.env;
const action = [];
jables.login({name: username, password}).then((user)=>{
    action.push("return");
    }, ()=>{
    action.push("throw");
})
const interval = setInterval(()=>{
    if(action.length){
        clearInterval(interval);
        if(action[0]==="return"){
            return
        }else{
            throw 1;
        }
    }
}, 200)
