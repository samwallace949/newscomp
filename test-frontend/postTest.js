

let reqTest = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/articles',
    data: {URL:"beep boop", Body: "All of the articles from the database!", Ignorable:true}
  };

export let dbPost = (req) => axios(req).then((response)=>console.log(response.data)).catch((error)=>console.log(error.response.status));

export let test = () => dbPost(reqTest);

export function makeQuery(s){
  let req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/queries',
    data: {Query : s}
  };
  console.log("Query String: " + s);
  axios(req)
  .then((response)=>{


      //display them prettily
      // for (let i = 0; i < response.data.URLList.length; i++){
      //   document.getElementById("results").innerText += response.data.URLList[i] + "\n";
      // }

      //display them in JSON format
      document.getElementById("results").innerText = JSON.stringify(response.data.topk);

    }
  )
  .catch((error)=>
    document.getElementById("results").innerText ="Error:\n" + JSON.stringify(error.response)
  );
}

export function contextualizeTerms(t){
  let req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/queries/contextualized',
    data: {terms: t}
  };

  axios(req)
  .then((response)=>{


      document.getElementById("in-context").innerText = JSON.stringify(response.data.examples);

    }
  )
  .catch((error)=>
    document.getElementById("results").innerText ="Error:\n" + JSON.stringify(error.response)
  );
}