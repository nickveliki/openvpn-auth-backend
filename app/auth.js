#!/root/.nvm/versions/node/v13.9.0/bin/node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path")
const makefolder = (folder)=>{
    if(!fs.existsSync(folder)){
        fs.mkdirSync(folder);
    }
        
}
const logEntry = (logData)=>{
    const D = new Date();
    const p = path.resolve(path.join(__dirname, "../", D.getFullYear().toString()))
    makefolder(p)
    const prefix = (D.getHours()<10?"0":"")+D.getHours()+":"+(D.getMinutes()<10?"0":"")+D.getMinutes()+":"+(D.getSeconds()<10?"0":"")+D.getSeconds()
    fs.writeFileSync(p+"/"+(D.getMonth()<9?"0":"")+(D.getMonth()+1)+"_"+(D.getDate()<10?"0":"")+D.getDate()+".log", prefix+": "+logData+"\r\n", {flag:"a"});
}
const {key, iv} = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.secdat")).toString());
const {username, password} = process.env;
const ivf = Buffer.from(JSON.parse(crypto.createDecipheriv("aes-128-gcm", Buffer.from(key, "base64"), Buffer.from(iv, "base64")).update(fs.readFileSync(path.resolve(__dirname, "../udb/definitions.jdf"))).toString()).Definitions.filter((item)=>item.split("#")[0].endsWith("user.jdf"))[0].split("#")[1].split(","))
const user = JSON.parse(crypto.createDecipheriv("aes-128-gcm", Buffer.from(key, "base64"), ivf).update(fs.readFileSync(path.resolve(__dirname, "../udb/user.jdf"))).toString()).Versions.filter(({name})=>name===username)[0];
if(!user||!user.approved){
    logEntry(`${username} failed to log in to vpn`)
    process.exit(1)
}else{
    const {publicKey} = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../.RSA")));
    const verify = crypto.createVerify("SHA256")
    verify.write(password);
    verify.end();
    if(verify.verify(publicKey, Buffer.from(user.password, "base64"))){
        logEntry(`${user.name}/${user.uid} logged in to vpn successfully`)
        process.exit(0)
    }else{
        logEntry(`${user.name}/${user.uid} failed to log in to vpn`)
        process.exit(1)
    }
}
__
