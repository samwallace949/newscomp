import {useState} from "react";
import ListGroup from "react-bootstrap/ListGroup";

import Example from "./Example";
const queryPosts = require("./apiCalls.js");


function ContextSearch(props){

    const [ex, changeExamples] = useState([]);
    const [term, changeTerm] = useState("");

    function trackSearch(e){
        changeTerm(e.target.value);
    }

    async function findContext(e){
        e.preventDefault();
        await queryPosts.contextualizeTerms(term).then((res)=>{
            changeExamples(res);
            console.log("Length of context response:", res.length);
        }).catch(err => {
            console.log(err);
        });
    }

    if(props.termLength === 0)return (<div style={{"margin-left":0+'%'}}>Make Query or Load Test data To See examples in context.</div>);
    return (
        <form onSubmit={findContext}>
            <input className = "search-bar context-bar border" placeholder="See terms from results in context" onChange={trackSearch}/>
            <button className = "searchButton border">Search!</button>
            
            <ListGroup style = {{"margin-left":5+'%', "margin-right": 5+"%", "max-height":500+"px", "overflow":"scroll"}}>
                {ex.length > 0 ? ex.map((x) => <ListGroup.Item>{x}</ListGroup.Item>) : <ListGroup.Item>No Examples Loaded.</ListGroup.Item>}
            </ListGroup>
        </form>
    );
}

export default ContextSearch;
