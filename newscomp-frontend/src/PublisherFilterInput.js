import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function PublisherFilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:"pub", publisher: props.pubNames[pubId]};

        props.handleFilterSubmit(out);
    }


    
    const [pubId, changePubId] = useState(0);


    
    return(
        <div className = "border">

            {props.pubNames ?
                (<>
                    <Dropdown onSelect={changePubId}>
                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                            {props.pubNames[pubId]}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {Object.values(props.pubNames).map((pub, pid) => 
                                (<Dropdown.Item eventKey={pid} value="testMetricChange">{pub}</Dropdown.Item>)
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </>)
                :
                <h5>No Publishers Loaded</h5>
            }

            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default PublisherFilterInput;