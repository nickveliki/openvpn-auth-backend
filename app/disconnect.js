const fs = require("fs");
const path = require("path");
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
    fs.writeFileSync(p+"/"+(D.getMonth()<9?"0":"")+(D.getMonth()+1)+"_"+(D.getDate()<10?"0":"")+D.getDate()+".vpnlog", prefix+": "+logData+"\r\n", {flag:"a"});
}
console.log(process.env)
logEntry(`${process.env.commonname} has disconnected`)