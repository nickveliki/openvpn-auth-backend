const route = require("express").Router();
const jables = require("../jableshandler");
const { confirm, recover } = require("../emailgen");
const {createToken, verifyToken} = require("../verlikifyHandler");
const {addLog, remLog, checkLog, sendMessage, decode} = require("../log");
const connection = require("../../connection.json");
const sendMail = require("../mail");
const {existsSync, readFileSync} = require("fs");
const getHTML = (filename, alternate)=>{
    return existsSync(filename)?readFileSync(filename):("<h1>"+(alternate||"something something... erm... SOMETHING!")+"</h1>")
}
route.post("/register", verifyToken, decode, (req, res, next)=>{
    jables.register(req.body).then((uid)=>{
        let token = JSON.stringify(createToken({uid, now:Date.now(), type:"confirm"}));
        while(token.includes('"')){
            token = token.replace('"', '');
        }
        sendMail(req.body.email, "confirm email", confirm(`${connection.protocol||'http'}://${connection.host||'localhost'}:${connection.port||3000}/user/confirm?vtoken=${token}`), true).then(()=>{
            res.status(201).end();
        }, (err)=>{
            console.log(err);
            res.status(500).json("sorry, there was an error. Try again later")
        })
    }, ({error, message})=>{
        res.status(error).json(message);
    })
})
route.post("/login", (req, res, next)=>{
    jables.login(req.body).then(({uid, password})=>{
        addLog({uid, password}).then(({warning, sessKey})=>{
            res.status(200).json({token: createToken({uid, now: Date.now(), type:"log"}), warning, sessKey})
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
                    res.statusCode=200;
                    res.end();
                }, ({error, message})=>{
                    res.status(error).json(message)
                })
            })
        }else{
            sendMessage({uid, message: {type:"token", token}}).then(()=>{
                res.statusCode=200;
                res.end()
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
            res.statusCode =201;
            res.end();
        }, ({error, message})=>{
            res.status(error).json(message);
        })
    }else{
        res.status(409).json("not a recovery token");
    }
})
module.exports=route;