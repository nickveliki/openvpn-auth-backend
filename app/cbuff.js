const crypto = require("crypto");
const createKey = (password)=>new Promise((res, rej)=>{
    crypto.pbkdf2(password, Buffer.from(new Date().toString()), 100, 32, "sha256", (err, key)=>{
        if(err){
            rej({error: 500, message: err});
        }else{
            res(key);
        }
    })
})
const encrypt = (rmessage, key)=>{
    if(typeof(rmessage)==="object"){
        rmessage=JSON.stringify(rmessage);
    }
    const iv = crypto.randomBytes(24);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const message = cipher.update(Buffer.from(rmessage)).toString("base64");
    return {iv: iv.toString("hex"), message}
}
const decrypt = (message, key, iv)=>{
    return crypto.createDecipheriv("aes-256-gcm", key, iv).update(Buffer.from(message, "base64")).toString();
}
module.exports = {
    createKey,
    encrypt,
    decrypt
}