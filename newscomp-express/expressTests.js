const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const secrets = require("./secrets.js");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(secrets.napikey);

let articleSchema = mongoose.Schema({"URL":String, "Body": String, "Ignorable": Boolean});
let articleModel = mongoose.model("articles", articleSchema);
let querySchema = mongoose.Schema({"Query":String, "URLList": [String], "Date":Date});
let queryModel = mongoose.model("queries", querySchema);

let articleRoutes = express.Router();
let queryRoutes = express.Router();

articleRoutes.get("/", async(req,res)=>{
    let query = {}
    if (query in req.body) query = req.body.query;
    let matches = await articleModel.find(query);
    res.send(matches);
});

articleRoutes.post("/", async(req,res)=>{
    let doc = new articleModel({"URL":req.body.URL, "Body":req.body.Body, "Ignorable": req.body.Ignorable});
    let post = await doc.save();
    res.send(post);
});

queryRoutes.post("/", async(req,res)=>{

    let urls = [];
    let nextPage = [];
    let pageNum = 1;

    do{

        nextPage = await newsapi.v2.everything({
            q: req.body.Query,
            language: 'en',
            page: pageNum
        }).then(response => {
            return response.articles.reduce((acc,nextResult) => {acc.push(nextResult.url);return acc;}, []);
        }).catch(err =>{
            return [];
        });

        nextPage.forEach(element => {
            urls.push(element);
        });

        pageNum++;

    }while(nextPage.length > 0)


    console.log(urls);
    //save to mongoDB
    let doc = new queryModel({"Query":req.body.Query, "URLList":urls, "Date": null});
    let post = await doc.save();
    res.send(post);

    //or not
    // res.send({q:req.body.Query, URLS:urls});
});

let connection = "mongodb+srv://" 
    + secrets.username 
    + ":" 
    + secrets.password 
    + "@articledata.ricrf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(connection)
    .then(() => {
        const app = express();
        app.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "http://localhost:8080");
            res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            next();
        });
        app.use(express.json());
        app.use("/articles", articleRoutes);
        app.use("/queries", queryRoutes);
        app.listen(5000, ()=>console.log("New Connection"));
    });

console.log("Server Started!");