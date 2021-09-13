let axios = require("axios");


let req = {
    method: 'post',
    headers:{"Accept":"application/json","Content-Type": "application/json"},
    url: 'http://localhost:5000/articles',
    data: {URL:"beep boop", Body: "All of the articles from the database!", Ignorable:true}
  };

axios(req).then((response)=>console.log(response.data)).catch((error)=>console.log(error.response.status));