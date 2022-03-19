from stateUtils import *

def get_tfidfs(filter_ref, urls, k=10, return_tfidf = True):

    tfidfs = {}
    tfs = {}

    #calculate tfidfs if not done already
    if 'tfidfs' not in filter_ref:

        for term in filtered['vocabSet']:

            tf = 0
            df = 1

            for doc in filtered['tokenized']:

                if doc not in urls:
                    continue

                if term in filtered['tokenized'][doc]:
                    df += 1
                    tf += len(filtered['tokenized'][doc][term])

            tfidfs[term] = tf/df
            tfs[term] = tf

        filter_ref['tfidfs'] = tfidfs
        filter_ref['tfs'] = tfs
    
    #otherwise, retrieve values
    else:

        tfidfs = filter_ref['tfidfs']
        tfs = filter_ref['tfs']


    tfidfs = sorted([ ( state['queryData']['filtered']['unstemmed'][tc[0]], tc[1] ) for tc in tfidfs.items()], reverse = True, key=lambda a: a[1])[:k]

    tfs = sorted([ ( state['queryData']['filtered']['unstemmed'][tc[0]], tc[1] ) for tc in tfs.items()], reverse = True, key=lambda a: a[1])[:k]

    return tfidfs if return_tfidf else tfs

def get_topics(filter_ref, urls, k=10):
    pass

def print_metrics(k):
    for metric in state['topk'].keys():
        print("Top {} metrics of {}:")
        for entry in state['topk'][metric][:k]:
            print(entry)