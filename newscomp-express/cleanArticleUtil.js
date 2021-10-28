const sw = require('stopword');



let len = (arr) => arr.length;

function numTokens(arr){
    return arr.reduce((acc, s) => acc + s.split(/\W+/).length, 0)
}

function reduceDict(obj, key){
    let sum = 0;
    for(let i in obj){
        sum += key(obj[i]);
    }
    return sum;
}

let countElements = (obj) => reduceDict(obj, len);

let countTokens = (obj) => reduceDict(obj, numTokens);

module.exports.filterTokens = function(obj){

    console.log("Total number of elements in dict before filtering:", countElements(obj));

    console.log("Total number of tokens in dict before filtering:", countTokens(obj));

    let trigger = 0;
    let paragraph = "";
    let token = "";
    let tokenDict = {};
    let out = {};
    let fullVocab = new Set();

    //for each webpage's list of paragraphs
    for(let i in obj){

        //set result dict values
        tokenDict[i] = {};
        out[i] = [];

        //for each paragraph
        for(let p = 0; p < obj[i].length; p++){

            paragraph = obj[i][p];

            //split paragraph into non-stopword tokens
            tokens = sw.removeStopwords(paragraph.split(/\W+/));

            //if pragraph longer than 8 tokens (naive check for inclusion in the article)
            if (tokens.length > 8){

                //add paragraph to filtered output.
                out[i].push(paragraph);

                //for each token in paragraph
                for(let t = 0; t < tokens.length; t++){

                    token = tokens[t];

                    if(token.length < 2) continue;

                    //add to vocab set
                    fullVocab.add(token);

                    //increment token dictionary value
                    if(token in tokenDict[i])tokenDict[i][token].push(p);
                    else tokenDict[i][token] = [p];

                }
            }
        }
    }


    console.log("Total number of elements in dict after filtering:", countElements(out));

    console.log("Total number of tokens in dict after filtering:", countTokens(out));

    return {"tokenized":tokenDict, "paragraphs":out, "vocabSet":fullVocab};
}

//takes in tokenized corpus, finds top k terms, returns the terms and examples of each of them based on document weighing
module.exports.topKTerms = function(tokenizedCorpus, k){
    terms = {};

    //populate the terms object
    tokenizedCorpus.vocabSet.forEach((term)=>{


        //set key
        terms[term] = 0;

        //populate value
        for(doc in tokenizedCorpus.tokenized){
            if(term in tokenizedCorpus.tokenized[doc]){
                terms[term] += tokenizedCorpus.tokenized[doc][term].length;
            }
        }

    });

    //sort the list of entries by frequency
    let topFreq = Object.entries(terms).sort((a,b) => b[1]-a[1]);
    
    //return top k
    if(k < topFreq.length)return topFreq.slice(0,k);
    return topFreq;
}

module.exports.examplesInContext = function(term, tokenizedCorpus, rawCorpus, n_examples){
    if(!term in tokenizedCorpus.vocabSet)return [];

    let out = [];
    let p = -1;

    for(doc in tokenizedCorpus.tokenized){
        if(term in tokenizedCorpus.tokenized[doc]){

            //p is set to the index of the paragraph which contains term
            p = tokenizedCorpus.tokenized[doc][term][0];

            //push this paragraph's entire text to the output array
            out.push(rawCorpus[doc][p]);
            if(out.length == n_examples) return out;
        }
    }

    return out;

}