

function TopTerm(props){
    return(
            <tr onClick={() => props.exampleHandler(props.term)}>
                <td>{props.idx}</td>
                <td>{props.term}</td>
                <td>{props.count.toFixed(3).slice(-4) === ".000" ? props.count:props.count.toFixed(3)}</td>
            </tr>
    );
}

export default TopTerm;