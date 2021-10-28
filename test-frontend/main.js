import {makeQuery, contextualizeTerms} from "./postTest.js";


document.getElementById("searchbutton").addEventListener("click", () => makeQuery(document.getElementById("queryinput").value));


document.getElementById("contextbutton").addEventListener("click", () => contextualizeTerms(document.getElementById("term-for-context").value.split(",")));


