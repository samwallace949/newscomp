#can pass this, since inverted index is constructed by node service and we can compile doc-specific tf values easily at filter or topk time
#returns false to not resave unchanged state to db
def compute(state):

    return False

#we do not need discrete options specified for this metric
def options(state):
    
    pass


def filter(state, term, threshold):

    filtered = state['filtered']

    out = []

    urls = list(state['raw'].keys())

    for url in urls:
        out.append(term in filtered['tokenized'][url] and  len(filtered['tokenized'][url][term]) > threshold)
    
    return out

def topk(state, docs, k=15):

    filtered = state['filtered']
    tfs = {}

    for term in filtered['vocabSet']:

        tf = 0
        df = 1

        for doc in docs:

            if term in filtered['tokenized'][doc]:
                df += 1
                tf += len(filtered['tokenized'][doc][term])

        tfs[term] = tf

    tfs = sorted([ ( filtered['unstemmed'][tc[0]], tc[1] ) for tc in tfs.items()], reverse = True, key=lambda a: a[1])[:k]

    return tfs