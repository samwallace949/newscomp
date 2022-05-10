import { useState } from "react";
import Filter from "./Filter";


const {makeQuery, getTestData, getOfflineData, getOfflineFeatureData} = require("./apiCalls.js");



function TopLevelSearch(props){


    const [searchQuery, changeQuery] = useState("");

    const [isTestData, changeIsTestData] = useState(false);
    const [isLoadingTestData, changeIsLoadingTestData] = useState(false);
    const [isLoadingOfflineData, changeIsLoadingOfflineData] = useState(false);
    const [isLoadingOfflineFeatureData, changeIsLoadingOfflineFeatureData] = useState(false);

    const [initFilterMetrics, changeInitFilterMetrics] = useState(null);
    const [sortMetricNames, changeSortMetricNames] = useState({
        "tf":"Term Frequency",
        "lda": "Topic",
        "pub": "Publisher",
        "ner": "Named Entities",
        "mfc1": "Detected Frames",
        "tfidf": "TF-IDF",
        "frameLabels": 'Ground-Truth Frames',
        "kMeans": "Clusters"
    });

    async function query(e){

        e.preventDefault();
        
        let dataloader = null;

        if(isLoadingOfflineFeatureData){
            //load the offline data with precomputed features into the backend
            dataloader = getOfflineFeatureData;
        }else if (isLoadingOfflineData){
            //load the offline data and compute the features.
            dataloader = getOfflineData;
        }else if (isLoadingTestData){
            //load the test data from mongodb
            dataloader = getTestData;
        }else{
            //load the data from this query
            dataloader = () => makeQuery(searchQuery, isTestData);
        }

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
    const isLoadingOfflineDataListener = () => changeIsLoadingOfflineData(!isLoadingOfflineData);
    const isLoadingOfflineFeatureDataListener = () => changeIsLoadingOfflineFeatureData(!isLoadingOfflineData);

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
                <input type="checkbox" id="load-test-data" className="search-checkbox" defaultChecked={isLoadingTestData} onChange={isLoadingTestDataListener}></input>
                <label for="load-test-data">Load the Test Data</label>
                <br></br>
                <input type="checkbox" id="load-offline-data" className="search-checkbox" defaultChecked={isLoadingOfflineData} onChange={isLoadingOfflineDataListener}></input>
                <label for="load-offline-data">Load the Offline Data</label>
                <br></br>
                <input type="checkbox" id="load-offline-feature-data" className="search-checkbox" defaultChecked={isLoadingOfflineFeatureData} onChange={isLoadingOfflineFeatureDataListener}></input>
                <label for="load-offline-feature-data">Load the Offline Data with Precomputed Features</label>
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