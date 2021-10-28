import { useState } from "react";

const queryPosts = require("../postTest.js");


function Filter(){

    const [topTerms, changeTerms] = useState([]);
    const [searchQuery, changeQuery] = useState("");


    async function query(e){
        e.preventDefault();

        await queryPosts.makeQuery(searchQuery).then((res) => {
            changeTerms(res);
        }).catch((err) =>{
            console.log(err);
        });
    }

    function trackSearch(e){
        changeQuery(e.target.value);
    }

    return (
    <div className="container border">
        <form onSubmit = {query}>
            <input className="search-bar query-bar border" placeholder = "Enter Query" onChange={trackSearch}></input>
            <button className="searchButton border">Search!</button>
        </form>
        <div/>
        
        <div className="results-grid-container">
            <div id="top-terms-container" className = "terms border">
                <span className = "termContent left" >Term</span>
                <span className = "termContent right" >Frequency</span>
                {topTerms.map((termCount) => TopTerm({term:termCount[0], count:termCount[1]}))}
            </div>
            {ContextSearch({termLength: topTerms.length})}
        </div>
    </div>
    );
}

function TopTerm(props){
    return(
        <div className = "border TopTerm">
            <span className = "termContent left" >{props.term}</span>
            <span className = "termContent right" >{props.count}</span>
        </div>
    );
}
function ContextSearch(props){

    const [ex, changeExamples] = useState([]);
    const [term, changeTerm] = useState("");

    function trackSearch(e){
        changeTerm(e.target.value);
    }

    async function findContext(e){
        e.preventDefault();
        await queryPosts.contextualizeTerms(term.split(",")).then((res)=>{
            changeExamples(res[0]);
            console.log("Length of context response:", res.length);
        }).catch(err => {
            console.log(err);
        });
    }

    if(props.termLength === 0)return (<div/>);
    return (
        <form onSubmit={findContext}>
            <input className = "search-bar context-bar border" placeholder="See terms from results in context" onChange={trackSearch}/>
            <button className = "searchButton border">Search!</button>
            {ex.map((x) => Example({exText:x}))}
        </form>
    );
}
function Example(props){
    console.log("called");
    return(
        <div className="border example-box">{props.exText}</div>
    );
}



export default Filter;