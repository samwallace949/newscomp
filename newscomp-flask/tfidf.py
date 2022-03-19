def compute(articles, vocabulary):
    pass

def filter(docs, threshold):
    pass

def topk(docs):
    pass

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