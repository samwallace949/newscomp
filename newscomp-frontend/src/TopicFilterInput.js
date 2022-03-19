import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function TopicFilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:"lda", topicId, topicSim};
        props.handleFilterSubmit(out);
    }

    const [topicId, changeTopicId] = useState(0);
    const [topicSim, changeTopicSim] = useState(0.5);

    function handleTopicSimChange(e){
        e.preventDefault();
        changeTopicSim(e.target.value);
    }


    
    return(
        <div className = "border">

                {props.topicNames ?
                    (<>
                        <Dropdown onSelect={changeTopicId}>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.topicNames? props.topicNames[topicId] : "No Topics Loaded"}
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                {Object.values(props.topicNames).map((topic, tid) => 
                                    (<Dropdown.Item eventKey={tid} value="testMetricChange">{topic}</Dropdown.Item>)
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                        <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={handleTopicSimChange} value={topicSim}></input>
                    </>)
                    :
                    <h5>No Topics Loaded</h5>
                }
                
            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default TopicFilterInput;