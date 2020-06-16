const fs = require("fs");
module.exports = {
    recover:(relp)=>{
        return fs.readFileSync("./app/emails/recover.html").toString().replace("${relp}", relp);
    },
    confirm:(relp)=>{
        return fs.readFileSync("./app/emails/confirm.html").toString().replace("${relp}", relp);
    },
    approve:(relp)=>fs.readFileSync("./app/emails/approve.html").toString().replace("${relp}", relp)

    

}