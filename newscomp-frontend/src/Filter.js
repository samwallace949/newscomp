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
    const [filterMetric2, changeFilterMetric2] = useState("Publisher");
    const [filterMetric3, changeFilterMetric3] = useState("Publisher");
    const filterMetricList = [filterMetric, filterMetric2, filterMetric3];
    const changeFilterMetricList = [changeFilterMetric, changeFilterMetric2, changeFilterMetric3];

    const loadFilterMetricOptions = (id) => async (metric) => {

        console.log(`Trying to load ${metric}`);

        changeFilterMetricOptionStatus(id)(false);

        changeFilterMetricList[id](metric);

        let res = await getFeatureOptions(metric);

        res.loaded = true;

        changeFilterMetricOptionsList[id](res);

    }

    const [filterMetricOptions, changeFilterMetricOptions] = useState({options: [],loaded:false});
    const [filterMetricOptions2, changeFilterMetricOptions2] = useState({options: [],loaded:false});
    const [filterMetricOptions3, changeFilterMetricOptions3] = useState({options: [],loaded:false});
    const filterMetricOptionsList = [filterMetricOptions, filterMetricOptions2, filterMetricOptions3];
    const changeFilterMetricOptionsList = [changeFilterMetricOptions, changeFilterMetricOptions2, changeFilterMetricOptions3];

    const changeFilterMetricOptionStatus = (id) => (val) => {
        let copy = JSON.parse(JSON.stringify(filterMetricOptionsList[id]));
        copy.loaded = val;
        changeFilterMetricOptionsList[id](copy);
    }

    const [filterList, changeFilterList] = useState([]);
    const [filterList2, changeFilterList2] = useState([]);
    const [filterList3, changeFilterList3] = useState([]);
    const filterListList = [filterList,filterList2,filterList3];
    const changeFilterListList = [changeFilterList,changeFilterList2,changeFilterList3];
    
    const appendToFilterList = (id) => (item) => {
        
        
        let copy = JSON.parse(JSON.stringify(filterListList[id]));
        copy.push(item);
        console.log(copy);
        changeFilterListList[id](copy);
    }

    //function for immutably changing the filter list
    const removeFilterByIndex = (id) => (idx) => {
        console.log(`Filter at index ${idx} has been deleted`);
        changeFilterListList[id](filterListList[id].filter((v,i) => i !== idx));
    }

    //handleMetricChange

    const [sortMetric, changeSortMetric] = useState("tf");
    const [sortMetric2, changeSortMetric2] = useState("tf");
    const sortMetricList = [sortMetric, sortMetric2];
    const changeSortMetricList = [changeSortMetric, changeSortMetric2];

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
    const [topTerms2, changeTerms2] = useState(
        props.initMetrics !== null ? 
            props.initMetrics 
            :
            {
                "tf": [],
                "tfidf":[]
            }
        );

    const topTermsList = [topTerms,topTerms2];
    const changeTermsList = [changeTerms, changeTerms2];
    

    const [examples, changeExamples] = useState([]);
    const [examples2, changeExamples2] = useState([]);
    const examplesList = [examples, examples2];
    const changeExamplesList = [changeExamples, changeExamples2];

    const [exampleLabel, changeExampleLabel] = useState(["",""]);
    const [exampleLabel2, changeExampleLabel2] = useState(["",""]);
    const exampleLabelList = [exampleLabel, exampleLabel2];
    const changeExampleLabelList = [changeExampleLabel, changeExampleLabel2];

    //id out of 2
    const handleExampleChange = (id) => async (metricVal)=>{
        const exampleStrings = await getExamples(currFilterIdList[id+1], sortMetricList[id], metricVal)
        changeExamplesList[id](exampleStrings);
        changeExampleLabelList[id]([sortMetricList[id], metricVal]);
    }

    const [currFilterId, changeCurrFilterId] = useState(-1);
    const [currFilterId2, changeCurrFilterId2] = useState(-1);
    const [currFilterId3, changeCurrFilterId3] = useState(-1);
    const currFilterIdList = [currFilterId, currFilterId2, currFilterId3];
    const changeCurrFilterIdList = [changeCurrFilterId, changeCurrFilterId2, changeCurrFilterId3];

    const [nValidDocs,changeNValidDocs] = useState(0);
    const [nValidDocs2,changeNValidDocs2] = useState(0);
    const [nValidDocs3,changeNValidDocs3] = useState(0);
    const nValidDocsList = [nValidDocs, nValidDocs2, nValidDocs3];
    const changeNValidDocsList = [changeNValidDocs, changeNValidDocs2, changeNValidDocs3];

    const [nValidSents, changeNValidSents] = useState(0);
    const [nValidSents2, changeNValidSents2] = useState(0);
    const [nValidSents3, changeNValidSents3] = useState(0);
    const nValidSentsList = [nValidSents, nValidSents2, nValidSents3];
    const changeNValidSentsList = [changeNValidSents, changeNValidSents2, changeNValidSents3];

    const [showDocMetrics, changeShowDocMetrics] = useState(false);
    const [showDocMetrics2, changeShowDocMetrics2] = useState(false);
    const [showDocMetrics3, changeShowDocMetrics3] = useState(false);
    const showDocMetricsList = [showDocMetrics, showDocMetrics2, showDocMetrics3];
    const changeShowDocMetricsList = [changeShowDocMetrics, changeShowDocMetrics2, changeShowDocMetrics3];

    const [sentenceLevelFiltering, changeSentenceLevelFiltering] = useState(true);

    const handleSentenceLevelFilteringChange = () => changeSentenceLevelFiltering(!sentenceLevelFiltering);

    //function for applying parent filter to the two smaller models
    async function applyParentFilter(e){
        
        e.preventDefault();

        const res = await applyFilterAndGetTopK(filterListList[0], sortMetric, sentenceLevelFiltering, sentenceLevelTopk);

        changeNValidDocsList[0](res.numDocs);
        changeNValidSentsList[0](res.numSentences);
        changeShowDocMetricsList[0](true);

        await applyCurrentFilter(0)(e);
        await applyCurrentFilter(1)(e);
    }
    
    //function for applying filter to two children (id is out of 2!!)
    const applyCurrentFilter = (id) => async (e) => {
        
        e.preventDefault();

        const res = await applyFilterAndGetTopK([...filterListList[id+1], ...filterListList[0]], sortMetricList[id], sentenceLevelFiltering, sentenceLevelTopk);
        
        changeCurrFilterIdList[id+1](res.filterId);
        
        let newTopTerms = {};
        newTopTerms[sortMetricList[id]] = res.topk ? res.topk : [];

        changeNValidDocsList[id+1](res.numDocs);
        changeNValidSentsList[id+1](res.numSentences);
        changeShowDocMetricsList[id+1](true);

        changeTermsList[id](newTopTerms);
    }

    const [sentenceLevelTopk, changeSentenceLevelTopk] = useState(true);
    const [sentenceLevelTopk2, changeSentenceLevelTopk2] = useState(true);
    const sentenceLevelTopkList = [sentenceLevelTopk, sentenceLevelTopk2];
    const changeSentenceLevelTopkList = [changeSentenceLevelTopk, changeSentenceLevelTopk2];

    //out of 2
    const handleSentenceLevelTopkChange = (id) => async () => {
        
        const currSentenceLevelTopk = sentenceLevelTopkList[id];
        changeSentenceLevelTopkList[id](!sentenceLevelTopkList[id]);

        const res = await getTopK(currFilterIdList[id+1], sortMetricList[id], !currSentenceLevelTopk);

        let newTopTerms = {};
        newTopTerms[sortMetricList[id]] = res.topk ? res.topk : [];

        changeTermsList[id](newTopTerms);
    }
    
    const getNewSorting = (id) => async (newSortMetric) => {

        console.log(`Fecthing data for sort metric ${newSortMetric}`);

        changeSortMetricList[id](newSortMetric);

        const res = await getTopK(currFilterIdList[id+1], newSortMetric, sentenceLevelTopkList[id]);

        let newTopTerms = {};
        newTopTerms[newSortMetric] = res.topk ? res.topk : [];

        changeTermsList[id](newTopTerms);
    }

    return(
        <>
            <form>
                <h5>Add Filter:</h5>
                <CorpusFeatureDropwdown onChange={loadFilterMetricOptions(0)} sortMetricNames={props.sortMetricNames}/>
                {filterMetricOptions.loaded &&
                    <FilterInput handleFilterSubmit={appendToFilterList(0)} featureName={filterMetric} filterParams={filterMetricOptions.options.params} categoricals={filterMetricOptions.options.categoricals} labels={filterMetricOptions.options.labels}/>
                }
                {filterList.length > 0 && 
                    (<>
                        <ul className="filter-list">
                            {filterList.map((f, i) => <FilterCard filter={f} idx={i} handleDelete={removeFilterByIndex(0)}/>)}
                        </ul>
                    </>)}
                <br></br>
                <button onClick={applyParentFilter}>Filter Articles</button>
                <input type="checkbox" id="sentence-filter" className="search-checkbox" defaultChecked={sentenceLevelFiltering} onChange={handleSentenceLevelFilteringChange}></input>
                <label for="sentence-filter">Filter at the Sentence Level</label>
                <div>
                    {showDocMetrics && (<h5>{"Features of "+nValidSents+" Sentences from "+nValidDocs+" Articles"}</h5>)}
                </div>
            </form>
            <div/>
            <br></br>
            <div className="results-grid-container">

                <div className="topk1">
                    <form>
                        <h5>Add Filter:</h5>
                        <CorpusFeatureDropwdown onChange={loadFilterMetricOptions(1)} sortMetricNames={props.sortMetricNames}/>
                        {filterMetricOptions2.loaded &&
                            <FilterInput handleFilterSubmit={appendToFilterList(1)} featureName={filterMetric2} filterParams={filterMetricOptions2.options.params} categoricals={filterMetricOptions2.options.categoricals} labels={filterMetricOptions2.options.labels}/>
                        }
                        {filterList2.length > 0 && 
                            (<>
                                <ul className="filter-list">
                                    {filterList2.map((f, i) => <FilterCard filter={f} idx={i} handleDelete={removeFilterByIndex(1)}/>)}
                                </ul>
                            </>)}
                        <br></br>
                        <button onClick={applyCurrentFilter(0)}>Filter Articles</button>
                        <input type="checkbox" id="sentence-filter" className="search-checkbox" defaultChecked={sentenceLevelFiltering} onChange={handleSentenceLevelFilteringChange}></input>
                        <label for="sentence-filter">Filter at the Sentence Level</label>
                        <div>
                            {showDocMetrics2 && (<h5>{"Features of "+nValidSents2+" Sentences from "+nValidDocs2+" Articles"}</h5>)}
                        </div>
                    </form>
                    <Table striped bordered hover size='sm'>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Feature</th>
                                <th>
                                    <CorpusFeatureDropwdown onChange={getNewSorting(0)} sortMetricNames={props.sortMetricNames}/>
                                    <input type="checkbox" id="topk-filter" className="search-checkbox" defaultChecked={sentenceLevelTopk} onChange={handleSentenceLevelTopkChange(0)}></input>
                                    <label for="topk-filter">Show Only Sentence-Level Values</label>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sortMetric in topTerms &&
                                topTerms[sortMetric].map((termCount, idx) => 
                                    <TopTerm idx={idx} term={termCount[0]} count={termCount[1]} exampleHandler={handleExampleChange(0)}/>)
                            ) 
                            || (!(sortMetric in topTerms) && <TopTerm idx={0} term={`No Results Loaded for ${sortMetric}`} count={0} />)
                            }
                        </tbody>
                    </Table>
                    <div className="example1">
                        {examples.length > 0 && (
                            <>
                            <h5>{"Showing examples of " + exampleLabel[0] + " with value " + exampleLabel[1]}</h5>
                            <ContextSearch examples={examples}/>
                            </>
                        )}
                    </div>
                </div>

                <div className="topk2"> 
                    <form>
                        <h5>Add Filter:</h5>
                        <CorpusFeatureDropwdown onChange={loadFilterMetricOptions(2)} sortMetricNames={props.sortMetricNames}/>
                        {filterMetricOptions3.loaded &&
                            <FilterInput handleFilterSubmit={appendToFilterList(2)} featureName={filterMetric3} filterParams={filterMetricOptions3.options.params} categoricals={filterMetricOptions3.options.categoricals} labels={filterMetricOptions3.options.labels}/>
                        }
                        {filterList3.length > 0 && 
                            (<>
                                <ul className="filter-list">
                                    {filterList3.map((f, i) => <FilterCard filter={f} idx={i} handleDelete={removeFilterByIndex(2)}/>)}
                                </ul>
                            </>)}
                        <br></br>
                        <button onClick={applyCurrentFilter(1)}>Filter Articles</button>
                        <input type="checkbox" id="sentence-filter" className="search-checkbox" defaultChecked={sentenceLevelFiltering} onChange={handleSentenceLevelFilteringChange}></input>
                        <label for="sentence-filter">Filter at the Sentence Level</label>
                        <div>
                            {showDocMetrics3 && (<h5>{"Features of "+nValidSents3+" Sentences from "+nValidDocs3+" Articles"}</h5>)}
                        </div>
                    </form>
                    <Table striped bordered hover size='sm' className="topk2">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Feature</th>
                                <th>
                                    <CorpusFeatureDropwdown onChange={getNewSorting(1)} sortMetricNames={props.sortMetricNames}/>
                                    <input type="checkbox" id="topk-filter" className="search-checkbox" defaultChecked={sentenceLevelTopk2} onChange={handleSentenceLevelTopkChange(1)}></input>
                                    <label for="topk-filter">Show Only Sentence-Level Values</label>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sortMetric2 in topTerms2 &&
                                topTerms2[sortMetric2].map((termCount, idx) => 
                                    <TopTerm idx={idx} term={termCount[0]} count={termCount[1]} exampleHandler={handleExampleChange(1)}/>)
                            ) 
                            || (!(sortMetric2 in topTerms2) && <TopTerm idx={0} term={`No Results Loaded for ${sortMetric2}`} count={0} />)
                            }
                        </tbody>
                    </Table>
                    <div className="example2">
                        {examples2.length > 0 && (
                            <>
                                <h5>{"Showing examples of " + exampleLabel2[0] + " with value " + exampleLabel2[1]}</h5>
                                <ContextSearch examples={examples2}/>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}

export default Filter;