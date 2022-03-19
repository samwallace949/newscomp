import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";


function CorpusFeatureDropdown(props){


    const [chosenMetric, changeChosenMetric] = useState("Term Frequency");

    function handleMetricChange(ek, e){

        e.preventDefault();

        for (let key in props.sortMetricNames){

            if (props.sortMetricNames[key] === e.target.innerText){

                changeChosenMetric(props.sortMetricNames[key]);
                props.onChange(key);
                return;

            }

        }
    }
    return(
        <Dropdown onSelect={handleMetricChange}>

            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {chosenMetric}
            </Dropdown.Toggle>

            <Dropdown.Menu>
                {Object.values(props.sortMetricNames).map((name) => 
                    (<Dropdown.Item value="testMetricChange">{name}</Dropdown.Item>)
                )}
            </Dropdown.Menu>

        </Dropdown>
    );
}

export default CorpusFeatureDropdown;