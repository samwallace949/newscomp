

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
  .then((response)=>
    document.getElementById("results").innerText = "Result:\n" + JSON.stringify(response)
  )
  .catch((error)=>
    document.getElementById("results").innerText ="Error:\n" + JSON.stringify(error.response)
  );
}