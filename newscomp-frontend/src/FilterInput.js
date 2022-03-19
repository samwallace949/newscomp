import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function FilterInput(props){
    
    function submitInputs(e){
        e.preventDefault();
        let out = {name:props.metricName};

        if (props.metricName === "pub"){
            out.pub = pubname;
            props.handleFilterSubmit(out);
        }
        else if (props.metricName == "lda" && props.topicNames){
            out.topicId = topicId;
            out.topicSim = topicSim;
            props.handleFilterSubmit(out);
        }
    }


    
    const [pubname, changePubname] = useState("");

    function changePublisher(e){
        e.preventDefault();
        changePubname(e.target.value);
    }

    const [topicId, changeTopicId] = useState(0);
    const [topicSim, changeTopicSim] = useState(0.5);

    function handleTopicChange(e){
        e.preventDefault();

        changeTopicId(e.target.value);
    }

    function handleTopicSimChange(e){
        e.preventDefault();
        changeTopicSim(e.target.value);
    }


    
    return(
        <div className = "border">

            {props.metricName == "pub" && 
                (<>
                    <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={changePublisher} value={pubname}></input>
                </>)
            }

            {props.metricName == "lda" &&
                (<>
                        {props.topicNames ?
                            (<>
                                <Dropdown onSelect={handleTopicChange}>
                                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                                        {props.topicNames? props.topicNames[topicId] : "No Topics Loaded"}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {Object.values(props.topicNames).map((name) => 
                                            (<Dropdown.Item value="testMetricChange">{name}</Dropdown.Item>)
                                        )}
                                    </Dropdown.Menu>
                                </Dropdown>
                                <input className="search-bar filter-bar border" placeholder = "Filter Info" onChange={handleTopicSimChange} value={topicSim}></input>
                            </>)
                            :
                            <h5>No Topics Loaded</h5>
                        }
                </>)
            }
            <button onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default FilterInput;