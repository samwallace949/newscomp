import {makeQuery} from "./postTest.js";


document.getElementById("searchbutton").addEventListener("click", () => makeQuery(document.getElementById("queryinput").value));
