const {sign, verify, setup} = require("verlikify");
setup("./.RSA");
const encodePassword = (password)=>sign(password);
const verifyPassword = (password, sig)=>verify(password, sig);
const hexToBase36 = (hex)=>{
    const cnum = []
    for (let i = 0; i *8 < hex.length; i++){
        cnum.push(parseInt(hex.substr(i*8, 8), 16).toString(36))
    }
    let cipherpart = cnum.shift();
    cnum.forEach((item)=>{
        cipherpart+="-"+item;
    })
    return  cipherpart;
}
const base36ToHex = (base36)=>{
    let sighex = "";
    const parts = base36.split("-");
    parts.forEach((base36)=>{
        const part = parseInt(base36, 36).toString(16)
        if (part.length<8){
            sighex+= "0"+part;
        }else{
            sighex+=part;
        }
        
        });
    return sighex;
}
const createToken = (object)=>{
    const db64 = JSON.stringify(object);
    const cipher = Buffer.from(sign(db64), "base64").toString("hex");   
    return `${hexToBase36(cipher)}.${Buffer.from(db64).toString("base64")}`;
}
const verifyToken = (req, res, next)=>{
    const base = (req.query.vtoken||req.headers.authorization.replace("vtoken ","")).split(".");
    const sighex = base36ToHex(base[0]);
    const comp =  Buffer.from(base[1], "base64").toString();
    if(verify(sighex, comp , "hex")){
        console.log("verified");
        req.vtd=JSON.parse(comp);
        next();
    }else{
        console.log("not verified");
        return res.status(401).json("invalid token")
    }
}
module.exports={
    encodePassword,
    verifyPassword,
    createToken,
    verifyToken,
    base36ToHex,
    hexToBase36,
    sign,
    verify
}