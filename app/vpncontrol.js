const {exec} = require("child_process");
const vpnconf = require("../vpnfonf.json");

const vpn = {};
const startVpn = (callback)=>{
    if(vpn.proc){
        vpn.proc.kill()
    }
    const proc = exec(`openvpn ${vpnconf.serverconf}`, callback);
    proc.on("close", console.log);
    proc.on("disconnect", console.log);
    proc.on("error", console.log);
    proc.on("exit", console.log);
    proc.on("message", console.log)
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

