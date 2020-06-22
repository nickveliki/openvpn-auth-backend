const {exec} = require("child_process");
const vpnconf = require("../vpnfonf.json");
const path = require("path")
const startVpn = (callback)=>{
    stopvpn().then(()=>{
        start(callback)
    }, ()=>{
        start(callback)
    })
    
}
const start = (callback)=>{
    const proc = exec(`openvpn ${vpnconf.serverconf.split(path.sep)[vpnconf.serverconf.split(path.sep).length-1]}`, {cwd: path.dirname(vpnconf.serverconf)}, (err, stdout)=>{
        status().then((pid)=>{
            callback(err, pid)
        }, ()=>{
            callback(err, false)
        })
    });
            proc.on("error", ()=>{
            console.log("error")
        });
}
const stopvpn = ()=>new Promise((res, rej)=>{
    status().then((pid)=>{
        exec(`kill ${pid}`, (err)=>{
            if(err){
                rej({error: 500, message:"exec error"})
            }else{
                res()
            }
        })
    }, ()=>{
        rej({error: 500, message:"vpn is already dead"})
    })
})
const status = ()=>new Promise((res, rej)=>{
    exec(`ps aux | grep ${vpnconf.serverconf.split(path.sep)[vpnconf.serverconf.split(path.sep).length-1]}`, (err, stdout)=>{
        if(err){
            rej(false);
        }else{
            const pro = stdout.split("\n").filter((item)=>item.length>0&&!item.includes("grep")).map((item)=>item.split(" ").filter((item)=>item.length>0))[0]
            if(pro){
                res(pro[1])
            }else{
                rej(false)
            }
        }
    })
})
module.exports={
    startVpn, stopvpn, status
}

