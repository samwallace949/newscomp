const axios = require("axios");

let reqTest = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/articles',
    data: {URL:"beep boop", Body: "All of the articles from the database!", Ignorable:true}
  };

export let dbPost = (req) => axios(req).then((response)=>console.log(response.data)).catch((error)=>console.log(error.response.status));

export let test = () => dbPost(reqTest);

export async function makeQuery(s){
  let req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/queries',
    data: {Query : s}
  };
  console.log("Query String: " + s);
  return await axios(req)
  .then((response)=>{

      //display them in JSON format
      return response.data.topk;

    }
  )
  .catch((error)=>{
      console.log(error);
  });
}

export async function contextualizeTerms(t){
  let req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/queries/contextualized',
    data: {terms: t}
  };

  return await axios(req)
  .then((response)=>{

    console.log(response.data.examples);
    return response.data.examples;

  }).catch((error)=>{
    console.log(error);
    return [error];
  });
}