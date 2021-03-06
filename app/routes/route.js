const route = require("express").Router();
const vpnconf = require("../../vpnfonf.json");
const jables = require("../jableshandler");
const vpncontrol = require("../vpncontrol");
const {verifyToken} = require("../verlikifyHandler");
const {encode, decode} = require("../log");
const fs = require("fs");
const { getUser, logEntry } = require("../jableshandler");
const dotToSlash = (r)=>{
    const [, address, mask] = r.split(" ")
    let masks = 0;
    let ad = address;
    if(!address.includes("/")){
        const bytes = mask.split(".");
        bytes.forEach((byte)=>{
            const bits = parseInt(byte).toString(2);
            bits.split("").forEach((bit)=>{
                if(bit=="1"){
                    masks++;
                }
            })
        })
    }else{
        masks = address.split("/")[1];
        ad=address.split("/")[0];
    }
    return (ad+"/"+masks)
}
const slashToDot = (s)=>{
    const [address, mask] = s.split("/");
    let nmask = "";
    for (let i = 0; i*8 < parseInt(mask); i++){
        nmask+="255."
    }
    nmask += Math.pow(2, parseInt(mask)%8)-1;
    while(nmask.split(".").length<4){
        nmask+=".0"
    }
    return `${address} ${nmask}`
}
route.get("/ccd", verifyToken, (req, res, next)=>{
    const uid = req.query.uid!=undefined?parseInt(req.query.uid):req.vtd.uid;
    jables.getUser({uid}).then((user)=>{
        const fcontent = fs.readFileSync(vpnconf.ccd+"/"+user.name).toString();
        res.status(200).json(encode(fcontent.length==0?[]:fcontent.split("\n").map((line)=>dotToSlash(line.split('"')[1])), req.vtd.uid))
    }, ({error, message})=>{
        res.status(error).json(message);
    })
})
route.post("/ccd", verifyToken, decode, (req, res, next)=>{
    const {uid, ccd} = JSON.parse(req.message);
    getUser({uid:uid?uid:req.vtd.uid}).then((user)=>{
        if(user.approved){
            fs.writeFileSync(vpnconf.ccd+"/"+user.name, ccd.map((route)=>`push "route ${slashToDot(route)}"`).join("\n"));
            res.status(201).json({});
        }else{
            res.status(403).json("you are not approved yet")
        }
        
    }, ({error, message})=>{
        res.status(error).json(message)
    })
})
route.get("/", verifyToken, (req, res, next)=>{
    res.status(200).json(encode(fs.readFileSync(vpnconf.serverconf).toString().split("\n").filter((line)=>line.includes("route")&&!line.includes("push")).map(dotToSlash), req.vtd.uid))
})
route.get("/conf", verifyToken, (req, res, next)=>{
    res.status(200).json(encode(fs.readFileSync(vpnconf.serverconf).toString(), req.vtd.uid));
})
route.post("/conf", verifyToken, decode, (req, res, next)=>{
    fs.writeFileSync(vpnconf.serverconf, req.message);
    logEntry(`server configuration altered by ${req.vtd.uid}`).then(()=>{
        res.status(201).end();
    }, (error, message)=>{
        res.status(error).json(message)
    })
})
route.get("/vpn", verifyToken, (req, res, next)=>{
    const {stop, start} = req.query;
    if(stop||start){
        jables.logEntry(`vpn ${stop?"stopped":"started"} by ${req.vtd.uid}`).then(()=>{
            if(req.query.stop){
                vpncontrol.stopvpn().then(()=>{
                    res.status(200).end();
                }, (error, message)=>{
                    res.status(error).json(message)
                });
            }else{
                vpncontrol.startVpn((err, pid)=>{
                    if(!err&&pid){
                        res.status(200).json(pid);
                    }else{
                        res.status(500).json({err, pid});
                    }
                })
            }
        }, (error, message)=>{
            res.status(error).json(message)
        })
    }else{
        vpncontrol.status().then((pid)=>{
            res.status(200).json(pid);
        }, ()=>{
            res.status(200).json(false);
        })
    }
    
    
})
module.exports=route;