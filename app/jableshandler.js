const jables = require("jables-multiproc");
//replace exampledomain with whatever you please, but for readability's sake, it should be the main domain you are backending for
const secdatpath = process.argv[3]||"/etc/exampledomain/.secdat";
const location = "./udb/";
const {encodePassword, verifyPassword} = require("./verlikifyHandler");
jables.setup({location, secDatFileLoc:secdatpath}).then(console.log).catch((error)=>{console.log("jablessetup", error)});
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
    }, ()=>{
        res([]);
    })
})
const getUser = ({uid, email, playerName})=>new Promise((res, rej)=>{
    getUsers().then((users)=>{
        let searchterm = uid!=undefined?"uid":email?"email":playerName?"playerName":null;
        if(searchterm!=null){
            const {i, before} = searchArray(searchterm, {uid, email, playerName}[searchterm], users);
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
            good = searchArray("userName", userData.playerName, users).before!==undefined;
            if(good){
                good = searchArray("email", userData.email, users).before!==undefined;
            }
            if(good){
                const uid = users.length>0?users[users.length-1].uid+1:0;
                userData.uid = uid;
                userData.password = encodePassword(userData.password);
                jables.writeDefinition({location, definition: updateObject(userBase, userData)}).then(()=>{
                    setTimeout(()=>{
                        jables.deleteVersion({location, definition: updateObject(userBase, {uid})}).catch(console.log);
                    },2*60*60*1000)
                    res(uid)
                }, rej);
            }else{
                rej({error: 401, message: "signup failed"})
            }
        })
    }else{
        rej({error: 401, message: "signup failed"})
    }
})
const confirm = (uid)=>jables.writeDefinition({location, definition: updateObject(userBase, {uid, confirmed: true, lockout: Date.now()})})
const login = (userData)=>new Promise((res, rej)=>{
    getUser(userData).then((user)=>{
        if(user.confirmed&&verifyPassword(user.password, userData.password)){
            res(user);
        }else{
            rej({error: 401, message:"login failed"})
        }
    },
    ()=>{
        rej({error: 401, message:"login failed"});
    })
})
const checkv = ({uid, playerName, email, now}) => new Promise((res, rej)=>{
    getUser({uid, email, playerName}).then((user)=>{
        if (!user.confirmed||now<user.lockout){
            rej({error: 403, message: "invalid token"})
        }else{
            res(user)
        }
    })
})
const logout = ({uid, now})=>new Promise((res, rej)=>{
    checkv({uid, now}).then(()=>{
        jables.writeDefinition({location, definition: updateObject(userBase, {uid, lockout: Date.now()})}).then(res, rej)
    }, rej)
    })
const patchUser = ({user, vtd})=>new Promise((res, rej)=>{
    if (user.password){
        user.password = encodePassword(user.password);
    }
    checkv({uid: user.uid, playerName: user.playerName, email: user.email, now: vtd.now}).then((currentUser)=>{
        if((user.playerName&&user.playerName!=currentUser.playerName)||(user.email&&user.email!=currentUser.email)){
            getUsers().then((users)=>{
                const matches = users.filter((item)=>{
                    let match = false;
                    if(user.playerName&&user.playerName!=currentUser.playerName&&user.playerName==item.playerName){
                        match = true;
                    }
                    if(user.email&&user.playerName!=currentUser.email&&user.email==item.email){
                        match = true;
                    }
                    return match;
                });
                if(matches.length>0){
                    rej({error: 403, message:"forbidden"})
                }else{
                    if(!user.uid){
                        user.uid=currentUser.uid;
                    }
                    jables.writeDefinition({location, definition: updateObject(userBase, user)}).then(res, rej);
                }
            })
        }else{
            if(!user.uid){
                user.uid=currentUser.uid;
            }
            jables.writeDefinition({location, definition: updateObject(userBase, user)}).then(res, rej);
        }
    }, rej)
})
getUsers().then((users)=>{
    if(users.length==0){
        register(require("./firstadmin.json")).then(console.log, console.log)
    }
}, console.log)
module.exports = {
    searchArray,
    register, 
    confirm,
    login,
    getUser,
    patchUser,
    logout
}