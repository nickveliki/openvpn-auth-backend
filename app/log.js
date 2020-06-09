const {createKey, encrypt, decrypt} = require("./cbuff");
const {searchArray, logEntry} = require("./jableshandler");
const {pushMessage} = require("./pushHandler");
const logged =  [];
const addLog = ({uid, password, subscription})=>new Promise((res, rej)=>{
    createKey(password).then((sessKey)=>{
        let warning = false
        const {i, before} = searchArray("uid", uid, logged);
        if(before===undefined){
            warning = true;
            sendMessage({uid, message:{type: "warning", text:"Someone is logging on to your account. If this isn't you, contact phil@thern.wtf"}}).catch(logEntry)
            logged[i].sesskey = sesskey;
            logged[i].subscription = subscription
        }else{
            logged.splice(before?i:(i+1), 0, {uid, sessKey, subscription});
        }
        res({warning, sessKey: sessKey.toString("base64")});
    }, rej)
        
        
})
const decode = (req, res, next)=>{
    const {i, before} = searchArray("uid", req.body.uid, logged);
    if(before===undefined){
        req.message = decrypt(req.body.message, logged[i].sessKey, Buffer.from(req.body.iv, "hex"));
        next();
    }else{
        return res.status(401).json("no session key associated with your uid")
    }
    
}
const encode = (message, uid)=>{
    const {i, before} = searchArray("uid", uid, logged);
    if(before===undefined){
        return encrypt(message, logged[i].sessKey)
    }
}
const remLog = (uid)=>{
    const {i, before} = searchArray("uid", uid, logged);
    if(before===undefined){
        logged.splice(i, 1);
        return true;
    }
    return false;
}
const checkLog = (uid)=>{
    return searchArray("uid", uid, logged).before===undefined;
}
const sendMessage = ({uid, message})=>new Promise((res, rej)=>{
    const {i, before} = searchArray("uid", uid, logged);
    if(before===undefined&&logged[i].subscription!=undefined){
        pushMessage({subscription: logged[i].subscription, message: encode(typeof(message)==="object"?JSON.stringify(message):message, uid)}).then(res, rej)
    }else{
        rej({error: 404, message:"no subscription registered under this uid"})
    }
})
module.exports = {
    addLog,
    decode,
    encode,
    remLog,
    checkLog,
    sendMessage
}