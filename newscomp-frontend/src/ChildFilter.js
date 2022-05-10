function ChildFilter(props){


    return(
        <div className="topk1">
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
            <div className="example1">
                {examples.length > 0 && (<ContextSearch examples={examples}/>)}
            </div>
        </div>);
}

export default ChildFilter;