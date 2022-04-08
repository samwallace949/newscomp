
//Constants
const MAX_ARTICLES = 100;

//Other Files
const ScrapeCluster = require("../utils/clusterUtil.js");
const Cleaner = require("../utils/cleanArticleUtil.js");
const secrets = require("../secrets.js");
const {querySchema, queryModel} = require("../schemas/querySchema.js");

//Libraries
const {readFileSync} = require("fs");
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
async function processAndSaveQueryData(rawQueryData, urlMetadataMap, isTest, isAylien){
    //tokenize and filter raw text
    const queryData = {raw: rawQueryData, filtered: Cleaner.filterTokens(rawQueryData), metadata: urlMetadataMap};

    //construct response object for this query
    const responseObject = {
        "query":req.body.Query,
        "urls":urls, 
        "dateTo": null,
        "dateFrom": null, 
        "queryData": queryData,
        "topk": Cleaner.topKTerms(queryData.filtered, 8),
        "isTest": isTest,
        "isAylien": isAylien,
        "success": true
    };

    //save to mongoDB as new document
    let doc = new queryModel(responseObject);

    if (isTest) await queryModel.deleteMany({isTest:true});
    if (isAylien) await queryModel.deleteMany({isAylien:true});

    await doc.save();

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

        const responseObject = await processAndSaveQueryData(rawQueryData, urlMetadataMap, req.body.isTest, false);

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

    try{
        const testData = await queryModel.findOne({"isAylien": true}).exec();
        if (testData){
            res.status(200).send(testData);
        }else{
            console.log("Database does not contain the aylien data. Loading Locally and adding to DB...")

            const aylienData = fs.readFileSync("../../aylien_corpus/aylien_articles.json");
            if(!aylienData)throw "No aylien data found on DB or Locally.";

            const responseObject = await processAndSaveQueryData(aylienData["raw"], aylienData["metadata"], false, true);

            res.status(200).send(responseObject);
        }

    }catch (error){
        respondWithError("", res, "Node Reading Test Data Error: " + error);
    }
    
});

queryRoutes.post("/aylien/write", async(req,res) =>{

    console.log("Wrting new test data...");

    await queryModel.deleteMany({isAylien:true});

    

    res.send(await queryModel.findOneAndUpdate({"isAylien": true}, req.body).exec());


});