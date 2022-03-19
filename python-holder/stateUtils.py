import math
from datetime import date

#global variable for storing the current query data, used to
#uodate frontend as well as provide models with text
#SHOULD NOT BE KEPT; FLASK SESSIONS WITH REDIS/DYNAMO CACHE SHOULD BE USED ONCE APP IS DEPLOYED
state = dict({})



def calc_metrics(filtered, k):

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

    return tfidfs,tfs

def print_metrics(k):
    for metric in state['topk'].keys():
        print("Top {} metrics of {}:")
        for entry in state['topk'][metric][:k]:
            print(entry)


def update_current_article_data(data):

    global state

    state = data

    #make the vocabulary a set again (stored and sent over connections as a list)
    state['queryData']['filtered']['vocabSet'] = set(state['queryData']['filtered']['vocabSet'])

    #calculate and save sorting metrics
    try:
        state['topk'] = dict({})
        state['topk']['tfidf'], state['topk']['tf'] = calc_metrics(state['queryData']['filtered'], 15)
        print_metrics(10)
    except Exception as e:
        print("Failed To Calculate Metrics")
        raise e



def get_current_article_data(data):



    return state['queryData']

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

    min_date, max_date = get_date_range()

    for curr_filter_key in state['filters']:

        curr_filter = state['filters'][curr_filter_key]

        if curr_filter['attr'] == 'publisher':
            if curr_filter['include']:
                good_pubs.add(curr_filter['name'])
            else:
                bad_pubs.add(curr_filter['name'])

        elif curr_filter['attr'] == 'date':
            min_date = date.fromisoformat(curr_filter['min_date'])
            max_date = date.fromisoformat(curr_filter['max_date'])
        
    exclude_pubs = len(good_pubs) == 0

    out = set()

    for url in state['queryData']['raw'].keys():
        if exclude_pubs :
            
        else:

        

#remove filter from state given filter id
def remove_filter(filter_id):



#add filter to the data accessible to the frontend, return id to filter used for deleting in the future.
def add_filter(attr, val, op):
    
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
