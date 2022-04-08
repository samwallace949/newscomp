//Mongoose Schema and Model Definitions

const mongoose = require("mongoose");

module.exports.querySchema = mongoose.Schema({
    "query":String,
    "urls": [String],
    "queryData":mongoose.Schema.Types.Mixed,
    "dateTo":Date,
    "dateFrom":Date,
    "topk": mongoose.Schema.Types.Mixed,
    "isTest":Boolean,
    "isAylien":Boolean
});
module.exports.queryModel = mongoose.model("queries", module.exports.querySchema);