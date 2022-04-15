//Libraries
const express = require("express");
const mongoose = require("mongoose");

//Other Files
const secrets = require("./secrets.js");
const {addQueryRoute} = require("./routes/queryRoute");

//Construct DB URI
let connection = "mongodb+srv://" 
    + secrets.username 
    + ":" 
    + secrets.password 
    + "@articledata.ricrf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


console.log("Waiting To Connect to DB...");

//Establish DB connection and listen on specified port
mongoose.connect(connection)
    .then(() => {
        const app = express();
        app.use(express.json());
        addQueryRoute(app);
        app.listen(process.env.PORT || 8080, ()=>console.log("Connected! Server now processing requests."));
    });