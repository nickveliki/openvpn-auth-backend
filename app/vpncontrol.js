const {exec} = require("child_process");
const vpnconf = require("../vpnfonf.json");
const path = require("path")
const vpn = {};
const startVpn = (callback)=>{
    const proc = exec(`openvpn ${vpnconf.serverconf.split(path.sep)[vpnconf.serverconf.split(path.sep).length-1]}`, {cwd: path.dirname(vpnconf.serverconf)}, callback);
    proc.on("close", ()=>{
        console.log("close")
    });
    proc.on("disconnect", ()=>{
        console.log("disconnect")
    });
    proc.on("error", ()=>{
        console.log("error")
    });
    proc.on("exit", ()=>{
        console.log("exit")
    });
    proc.on("message", ()=>{
        console.log("message")
    })
    vpn.proc = proc;
}
const stopvpn = ()=>{
    if(vpn.proc){
        vpn.proc.kill();
    }
}
const status = ()=>{
    if(vpn.proc&&!vpn.proc.killed){
        return true;
    }else{
        return false
    }
}
module.exports={
    startVpn, stopvpn, status
}

