import { useState } from "react";

import {getCorpusFeatureNames} from "./apiCalls";
import TopTerm from "./TopTerm";
import ContextSearch from "./Context";
import CorpusFeatureDropwdown from "./CorpusFeatureDropdown";

import {getFeatureOptions} from "./apiCalls";
import {applyFilterAndGetTopK, getTopK} from "./apiCalls";

// bootstrap imports
import Table from "react-bootstrap/Table";
import PublisherFilterInput from "./PublisherFilterInput";
import TopicFilterInput from "./TopicFilterInput";
import TFFilterInput from "./TFFilterInput";
import EntityFilterInput from "./EntityFilterInput";
import MFCFilterInput from "./MFCFilterInput";
import FilterCard from "./FilterCard";
import { Button } from "react-bootstrap";



function Filter(props){

    //NEEDED FROM TOPLEVELSEARCH:

    //filter, trackfilter
    const [filterMetric, changeFilterMetric] = useState("Publisher");
    async function loadFilterMetricOptions(metric){

        console.log(`Trying to load ${metric}`);

        changeFilterMetricOptionStatus(false);

        changeFilterMetric(metric);

        let res = await getFeatureOptions(metric, props.id);

        res.loaded = true;

        changeFilterMetricOptions(res);

    }

    const [filterMetricOptions, changeFilterMetricOptions] = useState({options: [],loaded:false});

    function changeFilterMetricOptionStatus(val){
        let copy = JSON.parse(JSON.stringify(filterMetricOptions));
        copy.loaded = val;
        changeFilterMetricOptions(copy);
    }

    const [filterList, changeFilterList] = useState([]);
    const appendToFilterList = (item) => {
        let copy = JSON.parse(JSON.stringify(filterList));
        copy.push(item);
        console.log(copy);
        changeFilterList(copy);
    }

    //function for immutably changing the filter list
    const removeFilterByIndex = (idx) => {
        console.log(`Filter at index ${idx} has been deleted`);
        changeFilterList(filterList.filter((v,i) => i !== idx));
    }

    //handleMetricChange

    const [sortMetric, changeSortMetric] = useState("tf");

    //topTerms
    const [topTerms, changeTerms] = useState(
        props.initMetrics !== null ? 
            props.initMetrics 
            :
            {
                "tf": [],
                "tfidf":[]
            }
        );

    const [currFilterId, changeCurrFilterId] = useState(-1);
    async function applyCurrentFilter(e){

        e.preventDefault();

        const res = await applyFilterAndGetTopK(filterList, sortMetric);
        
        changeCurrFilterId(res.filterId);
        
        let newTopTerms = {};

        newTopTerms[sortMetric] = res.topk ? res.topk : [];

        changeTerms(newTopTerms);
    }
    async function getNewSorting(newSortMetric){

        console.log(`Fecthing data for sort metric ${newSortMetric}`);

        changeSortMetric(newSortMetric);

        const res = await getTopK(currFilterId, newSortMetric);

        let newTopTerms = {};

        newTopTerms[newSortMetric] = res.topk ? res.topk : [];

        changeTerms(newTopTerms);
    }

    return(
        <>
            <form>
                <h5>Add Filter:</h5>
                <CorpusFeatureDropwdown onChange={loadFilterMetricOptions} sortMetricNames={props.sortMetricNames}/>
                {filterMetricOptions.loaded &&
                    (filterMetric === "pub" &&
                        <PublisherFilterInput handleFilterSubmit={appendToFilterList} pubNames = {filterMetricOptions.options}/>
                    ) || ( filterMetric === "lda" &&
                        <TopicFilterInput handleFilterSubmit={appendToFilterList} topicNames={filterMetricOptions.options}/>
                    ) || ( filterMetric === "tf" &&
                        <TFFilterInput handleFilterSubmit={appendToFilterList}/>
                    ) || ( filterMetric === "ner" &&
                        <EntityFilterInput handleFilterSubmit={appendToFilterList} entities={filterMetricOptions.options}/>
                    ) || (filterMetric === "mfc1" &&
                        <MFCFilterInput handleFilterSubmit={appendToFilterList} frameNames={filterMetricOptions.options}/>
                    )
                }
                {filterList.length > 0 && 
                    (<>
                        <ul className="filter-list">
                            {filterList.map((f, i) => <FilterCard filter={f} idx={i} handleDelete={removeFilterByIndex}/>)}
                        </ul>
                    </>)}
                <button onClick={applyCurrentFilter}>Filter Articles</button>
            </form>
            <div/>
            <br></br>
            <div className="results-grid-container">
                <Table striped bordered hover size='sm'>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Feature</th>
                            <th><CorpusFeatureDropwdown onChange={getNewSorting} sortMetricNames={props.sortMetricNames}/></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(sortMetric in topTerms &&
                            topTerms[sortMetric].map((termCount, idx) => 
                                <TopTerm idx={idx} term={termCount[0]} count={termCount[1]}/>)
                        ) 
                        || (!(sortMetric in topTerms) && <TopTerm idx={0} term={`No Results Loaded for ${sortMetric}`} count={0} />)
                        }
                    </tbody>
                </Table>

                <ContextSearch termLength={0}/>

            </div>
        </>
    );
}

export default Filter;