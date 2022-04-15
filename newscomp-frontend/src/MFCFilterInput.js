import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function MFCFilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:"mfc1", frame:props.frameNames[frameId]};
        props.handleFilterSubmit(out);
    }

    const [frameId, changeFrameId] = useState(0);


    
    return(
        <div className = "border">

                {props.frameNames ?
                    (<>
                        <Dropdown onSelect={changeFrameId}>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.frameNames? props.frameNames[frameId] : "No Frames Loaded"}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {Object.values(props.frameNames).map((frame, fid) => 
                                    (<Dropdown.Item eventKey={fid} value="testMetricChange">{frame}</Dropdown.Item>)
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </>)
                    :
                    <h5>No Frames Loaded</h5>
                }
                
            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default MFCFilterInput;