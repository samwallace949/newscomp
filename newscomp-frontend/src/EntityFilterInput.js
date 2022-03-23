import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function EntityFilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:"ner", entity, count};
        props.handleFilterSubmit(out);
    }

    const [entity, changeEntity] = useState(props.entities ? props.entities[0] : "");
    const [count, changeCount] = useState(0);

    function handleCountChange(e){
        e.preventDefault();
        changeCount(e.target.value);
    }


    
    return(
        <div className = "border">

                {props.entities ?
                    (<>
                        <Dropdown onSelect={changeEntity}>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.entities? entity : "No entities Loaded"}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {Object.values(props.entities).map((ent) => 
                                    (<Dropdown.Item eventKey={ent} value="testMetricChange">{ent}</Dropdown.Item>)
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                        <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={handleCountChange} value={count}></input>
                    </>)
                    :
                    <h5>No Entities Loaded</h5>
                }
                
            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default EntityFilterInput;