const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const route = require("./routes/route");
const user = require("./routes/user");
const path = require("path");

app.use(bodyParser.json());
app.use("/", express.static("./htdocs"));
app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    if (req.method === "OPTIONS"){
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
})
app.use("/user", user);
app.use("/exampleroute", route);
app.get("*", (req, res)=>{
    res.sendFile(path.resolve("./htdocs/index.html"));
})
module.exports=app;
