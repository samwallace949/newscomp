import {useState} from "react";


import Dropdown from "react-bootstrap/Dropdown";


function FilterInput({handleFilterSubmit, featureName, filterParams, categoricals, labels}){
    
    function submitInputs(e){
        e.preventDefault();
        let out = JSON.parse(JSON.stringify(filterVal));
        out.name = featureName;
        //resolve all categorical variable indices to the real labels
        Object.keys(categoricals).forEach((key) => {
            if(out[key] < categoricals[key].length) out[key] = categoricals[key][out[key]];
        });
        handleFilterSubmit(out);
    }

    const [filterVal, changeFilterVal] = useState(JSON.parse(JSON.stringify(filterParams)));

    function changeFilterField(field){
        return (e) => {

            //if the field is categorical, we write the event and not the target
            const is_categorical = !!(field in categoricals);
            if(!is_categorical)e.preventDefault();

            let copy = JSON.parse(JSON.stringify(filterVal));

            copy[field] = is_categorical ? e : e.target.value;
            changeFilterVal(copy);
        }
    }

    
    return(
        <div className = "border filter-input">

                {
                    Object.keys(filterParams).map((key) =>{
                        if (key in categoricals){
                            return(
                                <div className="filter-input-content">
                                    <h5>{labels[key]}</h5>
                                    <Dropdown onSelect={changeFilterField(key)}>
                                        <Dropdown.Toggle variant="success" id="dropdown-basic">
                                            {(categoricals[key] && categoricals[key].length > 0) ? categoricals[key][filterVal[key]] : "No Items Loaded"}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            {Object.values(categoricals[key]).map((val, idx) => 
                                                (<Dropdown.Item eventKey={idx} value="testMetricChange">{val}</Dropdown.Item>)
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            );
                        }
                        else{
                            return (
                                <div className="filter-input-content">
                                    <h5>{labels[key]}</h5>
                                    <input className="search-bar filter-bar border" placeholder = {filterParams[key]} onChange={changeFilterField(key)} value={filterVal[key]}></input>
                                    <br></br>
                                </div>
                            );
                        }
                    })
                }
            <br></br>
            <button className="filter-input-button filter-input-content" onClick={submitInputs}>Apply Filter</button>
        </div>
    );
}

export default FilterInput;