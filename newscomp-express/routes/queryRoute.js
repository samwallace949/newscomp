
//Constants
const MAX_ARTICLES = 100;
const OFFLINE_DATA = "../../aylien_corpus/aylien_articles.json";

//Other Files
const ScrapeCluster = require("../utils/clusterUtil.js");
const Cleaner = require("../utils/cleanArticleUtil.js");
const secrets = require("../secrets.js");
const {querySchema, queryModel} = require("../schemas/querySchema.js");

//Libraries
const {readFileSync, writeFileSync} = require("fs");
const {Router} = require("express");
const NewsAPI = require("newsapi");
const newsapi = new NewsAPI(secrets.napikey);

const queryRoutes = Router();

module.exports.addQueryRoute = function (app){
    app.use("/queries", queryRoutes);
}

function respondWithError(q, res,err){

    const responseObject = {
        "query":q,
        "urls":null, 
        "dateTo": null,
        "dateFrom": null, 
        "queryData": null,
        "isTest": null,
        "success": false,
        "error": err
    };


    res.send(responseObject);
}

//filter, save article data, return res object
async function processQueryData(query, rawQueryData, urlMetadataMap, isTest, isAylien){
    //tokenize and filter raw text
    const queryData = {raw: rawQueryData, filtered: Cleaner.filterTokens(rawQueryData), metadata: urlMetadataMap};

    //construct response object for this query
    const responseObject = {
        "query":query,
        "urls":Object.keys(urlMetadataMap), 
        "dateTo": null,
        "dateFrom": null, 
        "queryData": queryData,
        "topk": Cleaner.topKTerms(queryData.filtered, 8),
        "isTest": isTest,
        "isAylien": isAylien,
        "success": true
    };

    return responseObject;
}

queryRoutes.post("/", async(req,res)=>{

    let urlMetadataMap = {};
    let nextPage = [];
    let pageNum = 1;
    let scrapeSuccess = true;

    console.log("Request body: " + JSON.stringify(req.body));

    try{

        do{

            scrapeSuccess = await newsapi.v2.everything({
                q: req.body.Query,
                language: 'en',
                page: pageNum
            }).then(response => {

                for (let i = 0; i < response.articles.length; i++){

                    if(Object.keys(urlMetadataMap).length == MAX_ARTICLES) break;

                    urlMetadataMap[response.articles[i].url] = {
                        date:response.articles[i].publishedAt, 
                        publisher:response.articles[i].source.name
                    };

                }

                return true;

            }).catch(err =>{
                console.log("error in newsapi loop: " + err);
                return false;
            });

            pageNum++;

        }while(scrapeSuccess && nextPage.length > 0 && Object.keys(urlMetadataMap).length < MAX_ARTICLES);

        console.log(urlMetadataMap);

        const urls = Object.keys(urlMetadataMap);

        //scrape raw text from articles
        const rawQueryData = await ScrapeCluster.consumeArticles(urls).then(res =>{
            return res;
        }).catch(err =>{
            console.log(err);
            return {};
        });

        const responseObject = await processQueryData(req.body.query, rawQueryData, urlMetadataMap, req.body.isTest, false);

        //save to mongoDB as new document
        let doc = new queryModel(responseObject);

        if (req.body.isTest) await queryModel.deleteMany({isTest:true});

        await doc.save();

        res.status(200).send(responseObject);

    }catch (error){

        respondWithError(req.body.Query, res, "Article Scraping Result Error in Node: " + error);
    
    }

});


queryRoutes.get("/test-data/read", async(req,res) =>{

    console.log("Reading the test data...");

    try{
        const testData = await queryModel.findOne({"isTest": true}).exec();

        if (testData){
            res.status(200).send(testData);
        }else{
            throw "No Test Data Found";
        }

    }catch (error){
        respondWithError(req.body.Query, res, "Node Reading Test Data Error: " + error);
    }

});

queryRoutes.post("/test-data/write", async(req,res) =>{

    console.log("Wrting new test data...");

    res.send(await queryModel.findOneAndUpdate({"isTest": true}, req.body).exec());


});

//retrieve aylien data either from DB, or retrieve locally and push to DB
queryRoutes.get("/aylien/read", async(req,res) =>{

    const testData = await queryModel.findOne({"isAylien": true}).exec();

    if (testData){
        res.status(200).send(testData);
    }else{
        console.log("Database does not contain the aylien data. Loading Locally and adding to DB...")

        const aylienData = JSON.parse(readFileSync(OFFLINE_DATA));
        if(!aylienData)throw "No aylien data found on DB or Locally.";
        
        console.log(`Aylien data Loaded. Keys of data: ${Object.keys(aylienData)} totalling ${Object.keys(aylienData).length}`);


        //process offline data if it hasnt been already
        const responseObject = ("raw" in aylienData) ? await processQueryData("", aylienData["raw"], aylienData["metadata"], false, true) : aylienData;

        res.status(200).send(responseObject);
    }
    
});

queryRoutes.post("/aylien/write", async(req,res) =>{

    console.log("Wrting new test data...");

    // await queryModel.deleteMany({isAylien:true});

    // const doc = new queryModel(req.body);

    // res.send(await doc.save());

    writeFileSync(OFFLINE_DATA, JSON.stringify(req.body));

    res.send(req.body);

});