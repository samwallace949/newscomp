const axios = require("axios");

async function getQueryAndTopK(req){
  return await axios(req)
  .then((response)=>{
      return {query: response.data.query, topk: response.data.topk};
    }
  )
  .catch((error)=>{
      console.log(error);
  });
}

export async function makeQuery(s, isTest){

  const req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:3000/queries',
    data: {Query : s, isTest}
  };

  console.log("Query String: " + s);


  //returns the top k terms of the query after the data is passed to python
  return await getQueryAndTopK(req);
}

export async function getTestData(){
  const req = {
    method: 'get',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: `http://localhost:3000/queries/test-data/read`
  };

  return await getQueryAndTopK(req);

}


export async function contextualizeTerms(t){
  let req = {
    method: 'get',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: `http://localhost:3000/queries/contextualized/${t}`
  };

  return await axios(req)
  .then((response)=>{

    console.log(response.data.examples);
    return response.data;

  }).catch((error)=>{
    console.log(error);
    return [error];
  });
}


export async function getCorpusFeatureNames(){
  const req = {
    method:"get",
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: "http://localhost:3000/filter/names"
  };

  return await axios(req)
  .then((response)=>{

    console.log(response.data.names);
    return response.data.names;

  }).catch((error)=>{
    console.log(error);
    return ["No Names Found"];
  });
}

export async function getFeatureOptions(feature){
  const req = {
    method:"get",
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: `http://localhost:3000/filter/options/${feature}`
  };

  return await axios(req)
  .then((response)=>{

    console.log(response.data);
    return response.data;

  }).catch((error)=>{
    console.log(error);
    return [`No Options found for ${feature}`];
  });
}

export async function applyFilterAndGetTopK(flist, sortMetric){

  const req = {
    method:"post",
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    data: {flist, sortMetric},
    url: `http://localhost:3000/filter/create`
  }

  return await axios(req)
  .then((response)=>{

    console.log(response.data);
    return response.data;

  }).catch((error)=>{
    console.log(error);
    return null;
  });
}

export async function getTopK(fid, sortMetric){

  const req = {
    method:"post",
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    data: {fid, sortMetric},
    url: `http://localhost:3000/filter/topk`
  };

  console.log(`Making request by getTopK: ${JSON.stringify(req)}`)

  return await axios(req)
  .then((response)=>{

    console.log(response.data);
    return response.data;

  }).catch((error)=>{
    console.log(error);
    return null;
  });

}
