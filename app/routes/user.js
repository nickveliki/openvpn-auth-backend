const route = require("express").Router();
const jables = require("../jableshandler");
const { confirm, recover, approve } = require("../emailgen");
const {createToken, verifyToken} = require("../verlikifyHandler");
const {addLog, remLog, checkLog, sendMessage, decode, encode} = require("../log");
const connection = require("../../connection.json");
const sendMail = require("../mail");
const {existsSync, readFileSync, readdir, writeFileSync, write} = require("fs");
const { resolve, join} = require("path")
const mail = require("../mail");
const { searchArray } = require("../jableshandler");
const vpnconf = require("../../vpnfonf.json");

const getHTML = (filename, alternate)=>{
    return existsSync(filename)?readFileSync(filename):("<h1>"+(alternate||"something something... erm... SOMETHING!")+"</h1>")
}
route.post("/register", (req, res, next)=>{
    jables.register(req.body).then((uid)=>{
        let token = JSON.stringify(createToken({uid, now:Date.now(), type:"confirm"}));
        while(token.includes('"')){
            token = token.replace('"', '');
        }
        sendMail(req.body.email, "confirm email", confirm(`${connection.protocol||'http'}://${connection.host||'localhost'}:${connection.port||3000}/user/confirm?vtoken=${token}`), true).then(()=>{
            res.status(201).json({});
        }, (err)=>{
            res.status(500).json("sorry, there was an error. Try again later")
        })
    }, ({error, message})=>{
        res.status(error).json(message);
    })
})
route.post("/login", (req, res, next)=>{
    jables.login(req.body).then(({uid, password, approved})=>{
        addLog({uid, password}).then(({warning, sessKey})=>{
            res.status(200).json({token: createToken({uid, now: Date.now(), type:"log"}), approved, warning, sessKey})
        }, ({error, message})=>{
            res.status(error).json(message);
        });
        
    }, ()=>{
        res.status(401).json("Login failed");
    })
})
route.get("/confirm", verifyToken, (req, res, next)=>{
    const {type, now, uid}= req.vtd;
    if(type==="confirm"){
        if(Date.now()-now>2*60*60*1000){
            res.statusCode = 409;
            res.write(getHTML("./confirmtokenexpired.html"), "Confirm Token Expired" )
            res.end();
        }else{
            jables.confirm(uid).then((success)=>{
                if(success){
                    res.statusCode = 200;
                    res.write(getHTML("./welcome.html", "Welcome! You may log in now..."))
                    jables.getUsers().then((users)=>{
                        users.filter((user)=>user.approved).forEach((user)=>{
                            mail(user.email, `new user ${uid} awaiting approval`, approve(createToken({type: "approve", uid, from:user.uid})), true).then(()=>{}, console.log)
                        })
                    }, console.log)
                }else{
                    res.statusCode = 409;
                    res.write(getHTML("/whoopsie.html", "Wanna try that again?"));
                }
                res.end();
            })
        }
    }else{
        res.statusCode= 409;
        res.write(getHTML("./notaconfirmtoken.html", "Not a Confirm Token"))
        res.end();
    }
    
})
route.get("/logout", verifyToken, (req, res, next)=>{
    if(remLog(req.vtd.uid)){
        jables.logout(req.vtd).then(()=>{
            res.status(200).json("logged out successfully");
        }, ({error, message})=>{
            res.status(error).json(message)
        })
    }else{
        res.status(403).json("not allowed");
    }
})
route.get("/recover", (req, res, next)=>{
    jables.getUser(req.query).then(({uid, email})=>{
        const now = Date.now();
        const token = createToken({uid, now, type:"recover"})
        if(!checkLog(uid)){
            jables.logout({uid, now}).then(()=>{
                sendMail(email, "password recovery", recover(`${connection.protocol||'http'}://${connection.host||'localhost'}:${connection.port||3000}/user/confirm?vtoken=${token}`), true).then(()=>{
                    res.status(200).json({})
                }, ({error, message})=>{
                    res.status(error).json(message)
                })
            })
        }else{
            sendMessage({uid, message: {type:"token", token}}).then(()=>{
                res.status(200).json({})
            },()=>{
                res.status(403).json("not allowed");
            }
            )
        }
    }, ({error, message})=>{
        res.status(error).json(message);
    })
})
route.post("/pwreset", verifyToken, decode, (req, res, next)=>{
    if(req.vtd.type==="recover"){
        jables.patchUser({user: {uid: req.vtd.uid, password: req.message}, vtd: req.vtd}).then(()=>{
            res.status(201).json({})
        }, ({error, message})=>{
            res.status(error).json(message);
        })
    }else{
        res.status(409).json("not a recovery token");
    }
})
route.get("/approve", verifyToken, (req, res)=>{
    jables.approve(req.vtd).then((approvee)=>{
        res.status(200).json({})
        if(approvee.approved){
            mail(approvee.email, "congratulations", "You have been approved to join our VPN!")
            writeFileSync(vpnconf.ccd+"/"+approvee.name, "");
            writeFileSync(vpnconf.ccd+"/"+approvee.email, "");
        }
    }, ({error, message})=>{
        res.status(error).json(message)
})
})
route.get("/approvetoken", verifyToken, (req, res)=>{
    const uid = parseInt(req.query.uid);
    const from = req.vtd.uid;
    if(isNaN(uid)||isNaN(from)){
        console.log("NaN")
        res.status(409).json("uid and from must be in querystring and interpretable as numbers");
    }else{
        jables.getUsers().then((users)=>{
            console.log("got users")
            if(searchArray("uid", uid, users).before===undefined&&searchArray("uid", from, users).before===undefined){
                const json = encode(createToken({uid, from, type:"approve"}), req.vtd.uid)
                res.status(200).json(json)
            }else{
                res.status(401).json("failed")
            }
        }, ({error, message})=>{
            res.status(error).json(message)
        })
    }
})
route.get("/logs", verifyToken, (req, res, next)=>{
    const base = resolve(join(__dirname, "..", ".."))
    if(!req.query.files){
        readdir(base, (err, dir)=>{
            if(err){
                res.status(500).json(err)
            }else{
                const years = dir.filter((name)=>!isNaN(parseInt(name)));
                const responseobject = {};
                years.forEach((year)=>{
                    readdir(join(base, year), (err, dir)=>{
                        if(err){
                            responseobject[year]=err;
                        }else{
                            responseobject[year]=dir;
                        }
                        if(Object.keys(responseobject).length==years.length){
                            res.status(200).json(encode(responseobject, req.vtd.uid))
                        }
                    })
                })
            }
        })
    }else{
        const responseobj = {};
        req.query.files.split(",").forEach((file)=>{
            try{
            responseobj[file]=readFileSync(join(base, file)).toString("base64");
            } catch(e){
            responseobj[file]=err;
            }
        })
        res.status(200).json(encode(responseobj, req.vtd.uid));
    }
})
route.get("/", verifyToken, (req, res, next)=>{
    jables.getUsers().then((users)=>{
        res.status(200).json(encode(users.map(({approved, approvedby, uid, name, email, joined})=>({approved, approvedby, uid, name, email, joined})), req.vtd.uid))
    }, ({error, message})=>{
        res.status(error).json(message);
    })
})
module.exports=route;