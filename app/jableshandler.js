const jables = require("jables-multiproc");
const fs = require("fs");
//replace exampledomain with whatever you please, but for readability's sake, it should be the main domain you are backending for
const secdatpath = "./.secdat";
const location = "./udb/";
const {encodePassword, verifyPassword} = require("./verlikifyHandler");
jables.setup({location, secDatFileLoc:secdatpath}).then(console.log).catch((error)=>{console.log("jablessetup", error)});
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
    const D = new Date();
    makefolder("./"+D.getFullYear()).then(()=>{
        const prefix = D.getHours()+":"+D.getMinutes()+":"+D.getSeconds()
        fs.writeFileSync("./"+D.getFullYear()+"/"+(D.getMonth()+1)+"_"+D.getDate()+".log", prefix+": "+logData+"\r\n", {flag:"a"});
        res();
    })   
})
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
        console.log(obj)
        res(JSON.parse(obj).Versions);
    }, (error)=>{
        console.log(error)
        res([]);
    })
})
const getUser = ({uid, email, name})=>new Promise((res, rej)=>{
    console.log(uid, email, name)
    getUsers().then((users)=>{
        console.log(users);
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
                jables.writeDefinition({location, definition: updateObject(userBase, userData)}).then(()=>{
                    setTimeout(()=>{
                        jables.deleteVersion({location, definition: updateObject(userBase, {uid})}).then(()=>{
                            logEntry(`${userData.name}/${uid} failed to confirm their registration. deleted...`)
                        }).catch(console.log);
                    },2*60*60*1000)
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
const registerExposed = (userData, vtd)=>new Promise((res, rej)=>{
    checkv(vtd).then((user)=>{
        register(userData).then((uid)=>{
            logEntry(`${user.name}/${user.uid} registered ${userData.name}/${uid}`)
            res(uid)
        }, (error)=>{
            logEntry(JSON.stringify(error))
            rej(error)
        })
    }, (error)=>{
        logEntry(JSON.stringify(error))
        rej(error)
    })
})
const confirm = (uid)=>jables.writeDefinition({location, definition: updateObject(userBase, {uid, confirmed: true, lockout: Date.now()})})
const login = (userData)=>new Promise((res, rej)=>{
    console.log(userData)
    getUser(userData).then((user)=>{
        console.log(user);
        if(user.confirmed&&verifyPassword(user.password, userData.password)){
            logEntry(`${user.name}/${user.uid} login`).then(()=>{
                res(user);
            })
        }else{
            logEntry(`${user.name}/${user.uid} failed login`).then(()=>{
                console.log("login failed")    
                rej({error: 401, message:"login failed"})
            })
        }
    },
    (error)=>{
        console.log(error)
        logEntry(`${userData.name} failed login`).then(()=>{
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
    checkv({uid, now}).then(()=>{
        jables.writeDefinition({location, definition: updateObject(userBase, {uid, lockout: Date.now()})}).then(()=>{
            logEntry(`${user.name}/${user.uid} logout`)
            
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
getUsers().then((users)=>{
    if(users.length==0){
        register(require("./firstadmin.json")).then(()=>{logEntry("Authorization control and management system initialized")}, console.log)
    }
}, console.log)
module.exports = {
    searchArray,
    register: registerExposed, 
    confirm,
    login,
    getUser,
    patchUser,
    logout,
    logEntry
}