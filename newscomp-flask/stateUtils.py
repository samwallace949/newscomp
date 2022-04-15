import math
from datetime import date
import json

import lda
import tf
import pub
import ner


#global constants
SAVE_TO_JSON = True
# FEATURE_NAMES = ["lda", "tf", "pub", "ner"]
# FEATURE_MODULES = [lda, tf, pub, ner]

#no entity recognition: takes too long
FEATURE_NAMES = ["lda", "tf", "pub"]
FEATURE_MODULES = [lda, tf, pub]

#global variable for storing the current query data, used to
#uodate frontend as well as provide models with text
#SHOULD NOT BE KEPT; FLASK SESSIONS WITH REDIS/DYNAMO CACHE SHOULD BE USED ONCE APP IS DEPLOYED
state = dict({})


def calc_metrics(filtered, k=10, return_tfidf = True):

    tfidfs = {}
    tfs = {}

    for term in filtered['vocabSet']:

        tf = 0
        df = 1

        for doc in filtered['tokenized']:

            if term in filtered['tokenized'][doc]:
                df += 1
                tf += len(filtered['tokenized'][doc][term])

        tfidfs[term] = tf/df
        tfs[term] = tf

    tfidfs = sorted([ ( state['queryData']['filtered']['unstemmed'][tc[0]], tc[1] ) for tc in tfidfs.items()], reverse = True, key=lambda a: a[1])[:k]

    tfs = sorted([ ( state['queryData']['filtered']['unstemmed'][tc[0]], tc[1] ) for tc in tfs.items()], reverse = True, key=lambda a: a[1])[:k]

    return tfidfs if return_tfidf else tfs

#updates the state given the text data from a query, returns True if new data was generated and stored
def update_current_article_data(data):

    global state

    state = data

    #make the vocabulary a set again (stored and sent over connections as a list)
    state['queryData']['filtered']['vocabSet'] = set(state['queryData']['filtered']['vocabSet'])

    #make filter array to store the given filters
    state['filters'] = dict()
    state['nextFilterId'] = 0

    #calculate and save sorting metrics if not precomputed
    metrics_generated = False
    # try:

    for i,feature in enumerate(FEATURE_MODULES):
        print("Now calculating metric ", FEATURE_NAMES[i])
        metrics_generated = feature.compute(state['queryData']) or metrics_generated

    state['topk'] = dict({})
    state['topk']['tfidf'] = calc_metrics(state['queryData']['filtered'], k=15, return_tfidf = True)
    state['topk']['tf'] = calc_metrics(state['queryData']['filtered'], k=15, return_tfidf = False)
    # except Exception as e:
    #     print("Failed To Calculate Metrics")
    #     raise e

    #save query data state to run notebooks on
    if SAVE_TO_JSON:
        with open("./sampleData.json", "w") as wfile:
            state['queryData']['filtered']['vocabSet'] = list(state['queryData']['filtered']['vocabSet'])
            json.dump(state, wfile)
            state['queryData']['filtered']['vocabSet'] = set(state['queryData']['filtered']['vocabSet'])

    return metrics_generated

def get_options(feature):

    if feature == 'lda':
        return lda.options(state['queryData'])
    elif feature == 'pub':
        return pub.options(state['queryData'])
    elif feature == 'ner':
        return ner.options(state['queryData'])
    return ["Backend Has No options for {}".format(feature)]


def make_filter(flist):
    
    urls = list(state['queryData']['raw'].keys())

    url_map = [True] * len(urls)

    for f in flist:

        print("Filter Data: ", f.items())

        is_valid = [True] * len(urls)

        if f['name'] == "lda":
            is_valid = lda.filter(state['queryData'], f['topicId'], f['topicSim'])
        elif f['name'] == "tf":
            is_valid = tf.filter(state['queryData'], f['term'], f['count'])
        elif f['name'] == "pub":
            is_valid = pub.filter(state['queryData'], f['publisher'])
        elif f['name'] == "ner":
            is_valid = ner.filter(state['queryData'], f['entity'], f['count'])
        
        url_map = [url_map[i] and val for i, val in enumerate(is_valid)]
    
    state['filters'][state['nextFilterId']] = url_map

    state['nextFilterId'] += 1

    return state['nextFilterId'] - 1
    



def get_topk(fid, feature):
    
    topk = []

    if fid in state['filters']:

        valid_docs = [url for i, url in enumerate(state['queryData']['raw'].keys()) if state['filters'][fid][i]]
    else:
        valid_docs = list(state['queryData']['raw'].keys())

    feature_mod = FEATURE_MODULES[FEATURE_NAMES.index(feature)]

    if fid not in state['topk']:
        state['topk'][fid] = dict({})

    if feature in state['topk'][fid]:
        print("Returned cached topk value for " + feature)
        topk = state['topk'][fid][feature]
    else:
        topk = feature_mod.topk(state['queryData'], valid_docs)
        state['topk'][fid][feature] = topk

    return topk

def get_current_article_data():
    return state

#function returning sentences containing the selected keyword
def get_term_contexts(term, n_examples):
    qdata = state['queryData']

    if not term in qdata['filtered']['vocabSet']:
        return []
    
    out = []
    p = -1

    for (key,doc) in qdata['filtered']['tokenized'].items():
        if term in doc:
            
            p = doc[term][0]

            out.append(qdata['raw'][key][p])

            if len(out) == n_examples:
                break

    return out

def print_state_keys():
    print("State Keys:")
    for key in state:
        print(key)

def get_query_and_topk():

    print_state_keys()

    return dict([ ("query",state["query"]), ("topk",state["topk"]) ])

def calculate_valid_urls():


    good_pubs = set()

    bad_pubs = set()

    # min_date, max_date = get_date_range()

    for curr_filter in state['filters']:

        if curr_filter['attr'] == 'publisher':
            if curr_filter['include']:
                good_pubs.add(curr_filter['name'])
            else:
                bad_pubs.add(curr_filter['name'])

        # elif curr_filter['attr'] == 'date':
        #     min_date = date.fromisoformat(curr_filter['min_date'])
        #     max_date = date.fromisoformat(curr_filter['max_date'])
        
    exclude_pubs = len(good_pubs) == 0

    out = set()

    for url in state['queryData']['raw'].keys():

        if exclude_pubs and state['queryData']['metadata'][url]['publisher'] not in bad_pubs:
                out.add(url)
        elif state['queryData']['metadata'][url]['publisher'] in good_pubs:
                out.add(url)
        

#remove filter from state given filter id
def remove_filter(filter_id):

    if filter_id > len(state['filters']) or filter_id < 0:
        return
    
    del(state['filters'][filter_id])

    calculate_valid_urls()



#add filter to the data accessible to the frontend, return id to filter used for deleting in the future.
def add_pub_filter(include, name):
    state['filters'].append(dict({'attr':'publisher', 'name':name, 'include': include}))

    calculate_valid_urls()

    return len(state['filters'])
    
def get_publishers():

    out = set()

    for url in state['valid_urls']:

        out.add(state['queryData']['metadata'][url]['publisher'])

    return list(out)


def get_date_range():

    min_time = date.max

    max_time = date.min

    if len(state['valid_urls']) == 0:
        return date.isoformat(date.today), date.isoformat(date.today)

    for url in state['valid_urls']:

        published_date = date.fromisoformat( state['queryData']['metadata'][url]['date'] )

        if published_date > max_time:
            max_time = published_date
        
        if published_date < min_time:
            min_time = published_date
        


    return date.isoformat(min_time), date.isoformat(max_time)


def unpack_filter(data):
    return data['ref'], data['type'], data['val']
