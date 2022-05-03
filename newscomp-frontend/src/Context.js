import {useState} from "react";
import ListGroup from "react-bootstrap/ListGroup";
import ListGroupExpandableItem from "./ListGroupExpandableItem";

import Example from "./Example";
const queryPosts = require("./apiCalls.js");


function ContextSearch(props){

    return (
        <form>
            <ListGroup style = {{"margin-left":5+'%', "margin-right": 5+"%", "max-height":500+"px", "overflow":"scroll"}}>
                {props.examples.length > 0 ? props.examples.map((x) => <ListGroupExpandableItem example={x}/>) : <ListGroup.Item>No Examples Loaded.</ListGroup.Item>}
            </ListGroup>
        </form>
    );
}

export default ContextSearch;
