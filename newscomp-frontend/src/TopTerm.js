

function TopTerm(props){
    return(
            <tr>
                <td>{props.idx}</td>
                <td>{props.term}</td>
                <td>{props.count}</td>
            </tr>
    );
}

export default TopTerm;