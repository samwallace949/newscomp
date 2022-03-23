import { useState } from "react";
import Filter from "./Filter";


const {makeQuery, getTestData} = require("./apiCalls.js");



function TopLevelSearch(props){


    const [searchQuery, changeQuery] = useState("");
    const [isTestData, changeIsTestData] = useState(false);
    const [isLoadingTestData, changeIsLoadingTestData] = useState(false);
    const [initFilterMetrics, changeInitFilterMetrics] = useState(null);
    const [sortMetricNames, changeSortMetricNames] = useState({
        "tf":"Term Frequency",
        "lda": "Topic",
        "pub": "Publisher",
        "ner": "Named Entities"
    });

    async function query(e){

        e.preventDefault();

        const dataloader = isLoadingTestData ? getTestData : () => makeQuery(searchQuery, isTestData);

        await dataloader().then((res) => {

            console.log("Top K Object: " + JSON.stringify(res.topk));
            
            changeInitFilterMetrics(res.topk);

            //changeSortMetricNames(res.names);

            changeQuery(res.query);


        }).catch((err) =>{
            console.log("Encountered Error when fetching query Data");
            console.log(err);
        });

    }

    const isTestDataListener = () => changeIsTestData(!isTestData);
    const isLoadingTestDataListener = () => changeIsLoadingTestData(!isLoadingTestData);

    function trackSearch(e){
        changeQuery(e.target.value);
    }

    return (
    <div className="container border">

        {/* SEARCH BAR */}
        { props.isTopLevel?
            (<form onSubmit = {query}>
                <input className="search-bar query-bar border" placeholder = "Enter Query" onChange={trackSearch} value={searchQuery}></input>
                <br></br>
                <input type="checkbox" id="id-data" className="search-checkbox" defaultChecked={isTestData} onChange={isTestDataListener}></input>
                <label for="is-data">Make this the test data</label>
                <br></br>
                <input type="checkbox" id="load-data" className="search-checkbox" defaultChecked={isLoadingTestData} onChange={isLoadingTestDataListener}></input>
                <label for="load-data">Load the Test Data</label>
                <br></br>
                <button className="searchButton border">Search!</button>
            </form>)
            :
            null
        }

        {/* FILTER CONTAINER */}
        {initFilterMetrics != null && <Filter initMetrics={initFilterMetrics} sortMetricNames={sortMetricNames} id={0}/>}
    </div>
    );
}


export default TopLevelSearch;