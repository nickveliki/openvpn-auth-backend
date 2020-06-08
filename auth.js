const jables = require("./app/jableshandler");
const {username, password} = process.env;
const action = [];
try{
    jables.login({name: "nickveliki", password:"54726f6c6c"}).then((user)=>{
        action.push("return");
    }, ()=>{
        action.push("throw");
})
}catch(e){
    throw e;
}
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
