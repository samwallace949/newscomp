import { useState } from "react";

import {getCorpusFeatureNames} from "./apiCalls";
import TopTerm from "./TopTerm";
import ContextSearch from "./Context";
import CorpusFeatureDropwdown from "./CorpusFeatureDropdown";

import {getFeatureOptions} from "./apiCalls";
import {applyFilterAndGetTopK, getTopK, getExamples} from "./apiCalls";

// bootstrap imports
import Table from "react-bootstrap/Table";
import FilterCard from "./FilterCard";
import FilterInput from "./FilterInput";
import { Button } from "react-bootstrap";



function Filter(props){

    //NEEDED FROM TOPLEVELSEARCH:

    //filter, trackfilter
    const [filterMetric, changeFilterMetric] = useState("Publisher");
    async function loadFilterMetricOptions(metric){

        console.log(`Trying to load ${metric}`);

        changeFilterMetricOptionStatus(false);

        changeFilterMetric(metric);

        let res = await getFeatureOptions(metric);

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

    const [examples, changeExamples] = useState([]);
    async function handleExampleChange(metricVal){
        const exampleStrings = await getExamples(currFilterId, sortMetric, metricVal)
        changeExamples(exampleStrings);
    }

    const [currFilterId, changeCurrFilterId] = useState(-1);

    const [sentenceLevelFiltering, changeSentenceLevelFiltering] = useState(true);
    const handleSentenceLevelFilteringChange = () => changeSentenceLevelFiltering(!sentenceLevelFiltering);
    async function applyCurrentFilter(e){

        e.preventDefault();

        const res = await applyFilterAndGetTopK(filterList, sortMetric, sentenceLevelFiltering, sentenceLevelTopk);
        
        changeCurrFilterId(res.filterId);
        
        let newTopTerms = {};
        newTopTerms[sortMetric] = res.topk ? res.topk : [];

        changeTerms(newTopTerms);
    }

    const [sentenceLevelTopk, changeSentenceLevelTopk] = useState(true);
    async function handleSentenceLevelTopkChange (){
        
        const currSentenceLevelTopk = sentenceLevelTopk;
        changeSentenceLevelTopk(!sentenceLevelTopk);

        const res = await getTopK(currFilterId, sortMetric, !currSentenceLevelTopk);

        let newTopTerms = {};
        newTopTerms[sortMetric] = res.topk ? res.topk : [];

        changeTerms(newTopTerms);
    }
    
    async function getNewSorting(newSortMetric){

        console.log(`Fecthing data for sort metric ${newSortMetric}`);

        changeSortMetric(newSortMetric);

        const res = await getTopK(currFilterId, newSortMetric, sentenceLevelTopk);

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
                    <FilterInput handleFilterSubmit={appendToFilterList} featureName={filterMetric} filterParams={filterMetricOptions.options.params} categoricals={filterMetricOptions.options.categoricals} labels={filterMetricOptions.options.labels}/>
                }
                {filterList.length > 0 && 
                    (<>
                        <ul className="filter-list">
                            {filterList.map((f, i) => <FilterCard filter={f} idx={i} handleDelete={removeFilterByIndex}/>)}
                        </ul>
                    </>)}
                <br></br>
                <button onClick={applyCurrentFilter}>Filter Articles</button>
                <input type="checkbox" id="sentence-filter" className="search-checkbox" defaultChecked={sentenceLevelFiltering} onChange={handleSentenceLevelFilteringChange}></input>
                <label for="sentence-filter">Filter at the Sentence Level</label>
            </form>
            <div/>
            <br></br>
            <div className="results-grid-container">
                <Table striped bordered hover size='sm'>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Feature</th>
                            <th>
                                <CorpusFeatureDropwdown onChange={getNewSorting} sortMetricNames={props.sortMetricNames}/>
                                <input type="checkbox" id="topk-filter" className="search-checkbox" defaultChecked={sentenceLevelTopk} onChange={handleSentenceLevelTopkChange}></input>
                                <label for="topk-filter">Show Only Sentence-Level Values</label>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {(sortMetric in topTerms &&
                            topTerms[sortMetric].map((termCount, idx) => 
                                <TopTerm idx={idx} term={termCount[0]} count={termCount[1]} exampleHandler={handleExampleChange}/>)
                        ) 
                        || (!(sortMetric in topTerms) && <TopTerm idx={0} term={`No Results Loaded for ${sortMetric}`} count={0} />)
                        }
                    </tbody>
                </Table>

                {examples.length > 0 && (<ContextSearch examples={examples}/>)}

            </div>
        </>
    );
}

export default Filter;