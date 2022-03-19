import {useState} from "react";


function TFFilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:"tf", term, count};

        props.handleFilterSubmit(out);
    }


    
    const [term, changeTerm] = useState("");

    function handleTermChange(e){
        e.preventDefault();
        changeTerm(e.target.value);
    }

    const [count, changeCount] = useState(0);

    function handleCountChange(e){
        e.preventDefault();
        changeCount(Number(e.target.value));
    }


    
    return(
        <div className = "border">
            <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={handleTermChange} value={term}></input>
            <h5>Frequency Greater Than</h5>
            <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={handleCountChange} value={count}></input>
            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default TFFilterInput;