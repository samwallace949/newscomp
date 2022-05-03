

function TopTerm(props){
    return(
            <tr onClick={() => props.exampleHandler(props.term)}>
                <td>{props.idx}</td>
                <td>{props.term}</td>
                <td>{props.count}</td>
            </tr>
    );
}

export default TopTerm;