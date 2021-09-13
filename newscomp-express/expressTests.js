let express = require("express");
let mongoose = require("mongoose");
let secrets = require("./secrets.js");

let articleSchema = mongoose.Schema({"URL":String, "Body": String, "Ignorable": Boolean});
let articleModel = mongoose.model("articles", articleSchema);

let routes = express.Router();

routes.get("/", async(req,res)=>{

    let query = {}
    if (query in req.body) query = req.body.query;
    let matches = await articleModel.find(query);
    res.send(matches);
});

routes.post("/", async(req,res)=>{
    
    let doc = new articleModel({"URL":req.body.URL, "Body":req.body.Body, "Ignorable": req.body.Ignorable});
    let post = await doc.save();
    res.send(post);
});

let connection = "mongodb+srv://" 
    + secrets.username 
    + ":" 
    + secrets.password 
    + "@articledata.ricrf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connection)
    .then(() => {
        const app = express();
        app.use(express.json());
        app.use("/articles", routes);
        app.listen(5000, ()=>console.log("New Connection"));
    });

console.log("Server Started!");