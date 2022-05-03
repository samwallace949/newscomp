import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";

import {useState} from "react";

function ListGroupExpandableItem(props){
    

    const [isExpanded, changeExpanded] = useState(false);

    function handleExpand(e){
        e.preventDefault();
        changeExpanded(!isExpanded);
    }

    return isExpanded ?
            (<ListGroup.Item>
                {props.example[0]}
                <br></br>
                <b>{props.example[1]}</b>
                <br></br>
                {props.example[2]}
                <br></br>
                <Button onClick={handleExpand}>Show Less</Button>
            </ListGroup.Item>)
        :
            (<ListGroup.Item>
                {props.example[1] + '\n'}
                <br></br>
                <Button onClick={handleExpand}>Show More</Button>
            </ListGroup.Item>);

}

export default ListGroupExpandableItem;