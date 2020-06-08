const crypto = require("crypto");
const fs = require("fs");
const {key, iv} = JSON.parse(fs.readFileSync("./.secdat").toString());
const {username, password} = process.env;
const ivf = Buffer.from(JSON.parse(crypto.createDecipheriv("aes-128-gcm", Buffer.from(key, "base64"), Buffer.from(iv, "base64")).update(fs.readFileSync("./udb/definitions.jdf")).toString()).Definitions.filter((item)=>item.split("#")[0].endsWith("user.jdf"))[0].split("#")[1].split(","))
const user = JSON.parse(crypto.createDecipheriv("aes-128-gcm", Buffer.from(key, "base64"), ivf).update(fs.readFileSync("./udb/user.jdf")).toString()).Versions.filter(({name})=>name===username)[0];
if(!user){
    throw 1
}else{
    const {publicKey} = JSON.parse(fs.readFileSync("./.RSA"));
    const verify = crypto.createVerify("SHA256")
    verify.write(password);
    verify.end();
    if(verify.verify(publicKey, Buffer.from(user.password, "base64"))){
        return 0
    }else{
        throw 1
    }
}
