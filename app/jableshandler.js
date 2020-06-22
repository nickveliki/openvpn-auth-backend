const jables = require("jables-multiproc");
const fs = require("fs");
//replace exampledomain with whatever you please, but for readability's sake, it should be the main domain you are backending for
const secdatpath = "./.secdat";
const location = "./udb/";
const path = require("path");
const {encodePassword, verifyPassword} = require("./verlikifyHandler");
const makefolder = (folder)=>new Promise((res)=>{
    fs.exists(folder, (exists)=>{
        if(!exists){
            fs.mkdir(folder, ()=>{
                res();
            })
        }else{
            res()
        }
    })
})
const logEntry = (logData)=>new Promise((res)=>{
    if(typeof(logData)==="object"){
        logData=JSON.stringify(logData);
    }
    const D = new Date();
    const folder = path.resolve(path.join(__dirname,"..", D.getFullYear().toString()))
    makefolder(folder).then(()=>{
        const prefix = (D.getHours()<10?"0":"")+D.getHours()+":"+(D.getMinutes()<10?"0":"")+D.getMinutes()+":"+(D.getSeconds()<10?"0":"")+D.getSeconds()
        fs.writeFileSync(folder+"/"+(D.getMonth()<9?"0":"")+(D.getMonth()+1)+"_"+(D.getDate()<10?"0":"")+D.getDate()+".log", prefix+": "+logData+"\r\n", {flag:"a"});
        res();
    })   
})
jables.setup({location, secDatFileLoc:secdatpath}).then(console.log).catch(console.log);
const searchArray = (searchkey, searchvalue, array)=>{
    if(array.length>0){
    let search = array.map((item)=>item).sort((a, b)=>a[searchkey]<b[searchkey]?-1:1);
    let bound = Math.round(search.length/2);
    while(search.length>1){
        if (searchvalue<search[bound][searchkey]){
            search.splice(bound, search.length-bound);
        }else{
            search.splice(0, bound);
        }
        bound=Math.round(search.length/2);
    }
    return {before: searchvalue!=search[0][searchkey]?searchvalue<search[0][searchkey]:undefined , i: array.indexOf(search[0])}
    }
    return {before: true, i: 0}
    }
    const updateObject = (original, update)=>{
        const merge = {};
        Object.keys(original).forEach((key)=>{
            merge[key]=original[key];
        });
        Object.keys(update).forEach((key)=>{
            merge[key]=update[key];
        })
        return merge;
    }
const userBase = {path:"user", indexKey: "uid"}
const getUsers = ()=> new Promise((res)=>{
    jables.getDefinition({location, definition: userBase}).then((obj)=>{
        res(JSON.parse(obj).Versions);
    }, (error)=>{
        res([]);
    })
})
const getUser = ({uid, email, name})=>new Promise((res, rej)=>{
    getUsers().then((users)=>{
        let searchterm = uid!=undefined?"uid":email?"email":name?"name":null;
        if(searchterm!=null){
            const {i, before} = searchArray(searchterm, {uid, email, name}[searchterm], users);
            if(before===undefined){
                res(users[i]);
            }
            rej({error: 404, message:"No user found with provided search parameters"});
        }
    })
})
const register = (userData)=>new Promise((res, rej)=>{
    if(userData.name&&userData.email&&userData.password){
        getUsers().then((users)=>{
            let good = true;
            good = searchArray("userName", userData.name, users).before!==undefined;
            if(good){
                good = searchArray("email", userData.email, users).before!==undefined;
            }
            if(good){
                const uid = users.length>0?users[users.length-1].uid+1:0;
                userData.uid = uid;
                userData.password = encodePassword(userData.password);
                userData.joined = new Date().toUTCString()
                if(userData.confirmed){
                    userData.approved=true;
                    const {ccd} = require("../vpnfonf.json")
                    fs.writeFileSync(ccd+"/"+userData.name, "");
                }
                jables.writeDefinition({location, definition: updateObject(userBase, userData)}).then(()=>{
                    if (!userData.confirmed){
                        setTimeout(()=>{
                            getUser(userData).then(({confirmed})=>{
                                if(!confirmed){
                                    jables.deleteVersion({location, definition: updateObject(userBase, {uid})}).then(()=>{
                                        logEntry(`${userData.name}/${uid} failed to confirm their registration. deleted...`)
                                    }).catch(logEntry);
                                }
                            }, logEntry)
                            
                        },2*60*60*1000)
                        logEntry(`${userData.name}/${uid} has applied for membership`)
                    }
                    res(uid)
                }, (error)=>{
                logEntry(JSON.stringify(error))
                rej(error)
                });
            }else{
                rej({error: 401, message: "signup failed"})
            }
        })
    }else{
        rej({error: 401, message: "signup failed"})
    }
})
const confirm = (uid)=>new Promise((res, rej)=>{
    getUser({uid}).then((user)=>{
        jables.writeDefinition({location, definition: updateObject(userBase, {uid, confirmed: true, lockout: Date.now()})}).then(()=>{
            logEntry(`${user.name}/${user.uid} email address confirmed`)
            res(user);
        }, rej)
    }, rej)
})
const login = (userData)=>new Promise((res, rej)=>{
    getUser(userData).then((user)=>{
        if(user.confirmed&&verifyPassword(user.password, userData.password)){
            logEntry(`${user.name}/${user.uid} login to management success`).then(()=>{
                res(user);
            })
        }else{
            logEntry(`${user.name}/${user.uid} failed login to management`).then(()=>{ 
                rej({error: 401, message:"login failed to management"})
            })
        }
    },
    (error)=>{
        logEntry(`${userData.name} failed login to management`).then(()=>{
            rej({error: 401, message:"login failed"});
        })
    })
})
const checkv = ({uid, name, email, now}) => new Promise((res, rej)=>{
    getUser({uid, email, name}).then((user)=>{
        if (!user.confirmed||now<user.lockout){
            rej({error: 403, message: "invalid token"})
        }else{
            res(user)
        }
    })
})
const logout = ({uid, now})=>new Promise((res, rej)=>{
    checkv({uid, now}).then((user)=>{
        jables.writeDefinition({location, definition: updateObject(userBase, {uid, lockout: Date.now()})}).then(()=>{
            logEntry(`${user.name}/${user.uid} logout from management`)
            res();
        }, (error)=>{
            logEntry(JSON.stringify(error))
            rej(error)
            })
        }, (error)=>{
        logEntry(JSON.stringify(error))
        rej(error)
})
    })
const patchUser = ({user, vtd})=>new Promise((res, rej)=>{
    if (user.password){
        user.password = encodePassword(user.password);
    }
    checkv({uid: user.uid, name: user.name, email: user.email, now: vtd.now}).then((currentUser)=>{
        if((user.name&&user.name!=currentUser.name)||(user.email&&user.email!=currentUser.email)){
            getUsers().then((users)=>{
                const matches = users.filter((item)=>{
                    let match = false;
                    if(user.name&&user.name!=currentUser.name&&user.name==item.name){
                        match = true;
                    }
                    if(user.email&&user.name!=currentUser.email&&user.email==item.email){
                        match = true;
                    }
                    return match;
                });
                if(matches.length>0){
                    logEntry(`${currentuser.name}/${currentuser.uid} failed to rename`)
                    rej({error: 403, message:"forbidden"})
                }else{
                    if(!user.uid){
                        user.uid=currentUser.uid;
                    }
                    jables.writeDefinition({location, definition: updateObject(userBase, user)}).then(()=>{
                        logEntry(`${user.name}/${user.uid} data changed`)
                        res();
                    },  (error)=>{
                        logEntry(JSON.stringify(error))
                        rej(error)
                        });
                }
            })
        }else{
            if(!user.uid){
                user.uid=currentUser.uid;
            }
            jables.writeDefinition({location, definition: updateObject(userBase, user)}).then(()=>{
                logEntry(`${user.name}/${user.uid} data changed`)
                res();
            },  (error)=>{
                logEntry(JSON.stringify(error))
                rej(error)
                });
        }
    }, (error)=>{
logEntry(JSON.stringify(error))
rej(error)
})
})
const approve = ({uid, from, type})=>new Promise((res, rej)=>{
    if(type==="approve"){
        getUsers().then((users)=>{
            const approvee = searchArray("uid", uid, users);
            const approver = searchArray("uid", from, users);
            if(approvee.before===undefined&&approver.before===undefined){
                if(users[approver.i].approved){
                    let write = true;
                    if(users[approvee.i].approvedby){
                        if(!users[approvee.i].approvedby.includes(from)){
                            users[approvee.i].approvedby.push(from);
                        }else{
                            write = false;
                        }
                    }else{
                        users[approvee.i].approvedby=[from];
                    }
                    if(users[approvee.i].approvedby.length>users.filter(({approved})=>approved).length/2){
                        users[approvee.i].approved = true;
                    }
                    if(write){
                        jables.writeDefinition({location, definition: updateObject(userBase, users[approvee.i])}).then(()=>{
                            logEntry(`${from} approved ${uid}, ${users[approvee.i].approved?"fully approved":(Math.ceil(users.filter(({approved})=>approved).length/2-users[approvee.i].approvedby.length)+" votes missing")}`);
                            res(users[approvee.i]);
                        }, (error)=>{
                            logEntry(JSON.stringify(error))
                            rej(error)
                        })
                    }else{
                        logEntry(`${from} failed to approve ${uid}: ${from} already approved ${uid}`);
                        rej({error: 403, message: "forbidden"})
                    }
                }else{
                    logEntry(`${from} failed to approve ${uid}: ${from} is not yet approved`)
                    rej({error: 403, message: "forbidden"})
                }
            }else{
                logEntry(`${from} failed to approve ${uid}: one or both users don't exist`)
                rej({error: 403, message:"forbidden"})
            }
        })
    }else{
        logEntry(`${from} failed to approve ${uid}: no approval token`)
        rej({error: 406, message:"not an approval token!"})
    }
})
getUsers().then((users)=>{
    if(users.length==0){
        register(require("./firstadmin.json")).then(()=>{logEntry("Authorization control and management system initialized")}, logEntry)
    }
}, logEntry)
module.exports = {
    searchArray,
    register, 
    confirm,
    login,
    getUser,
    patchUser,
    logout,
    logEntry,
    getUsers,
    approve
}