import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";


function FilterCard(props){

    function getFilterProps(f){
        let out = [];

        for (let key in f){
            if (key !== "name")out.push(`${key}: ${f[key]}`);
        }

        return out;
    }

    return (
        <Card>
            <Card.Header>{props.filter.name}</Card.Header>
            <Card.Body>{getFilterProps(props.filter).map((txt) =>(
                <>
                    <Card.Text><small>{txt}</small></Card.Text>
                </>
            ))}
            </Card.Body>
            <Button variant="danger" onClick={() => props.handleDelete(props.idx)}>Delete</Button>
        </Card>
    );
}

export default FilterCard;