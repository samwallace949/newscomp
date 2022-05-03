import random
from nltk import PorterStemmer

ps = PorterStemmer()
#can pass this, since inverted index is constructed by node service and we can compile doc-specific tf values easily at filter or topk time
#returns false to not resave unchanged state to db
def compute(state):

    return False

#we do not need discrete options specified for this metric
def options(state):
    
    out = {
        "params":{
            "term":"",
            "threshold":0
        },
        "categoricals":{},
        "labels":{
            "term":"Term: ",
            "threshold": "Minimum Occurrances"
        }
    }

    return out


def filter(state, params):
    return -1

def topk(state, sentences, k=15):

    filtered = state['filtered']
    tfs = {}

    for term in filtered['vocabSet']:

        tf = 0
        df = 1
        #technically a brute-force, but the term-sentence index means that searching for a sentence index should not be too hard
        for doc in sentences:
            if term in filtered['tokenized'][doc]:
                for sentence in filtered['tokenized'][doc][term]:
                    if sentence in sentences[doc]:
                        tf += 1
                df += 1
        tfs[term] = tf/df

    tfs = sorted([ ( filtered['unstemmed'][tc[0]], tc[1] ) for tc in tfs.items()], reverse = True, key=lambda a: a[1])[:k]

    return tfs

def examples(state, term, sentences, k=5):

    filtered = state['filtered']

    term_stemmed = ps.stem(term.lower())

    ex_list = []

    for doc in sentences:
        if term_stemmed in filtered['tokenized'][doc]:
            for sentence in sentences[doc]:
                if sentence in filtered['tokenized'][doc][term_stemmed]:
                    ex_list.append((doc, sentence, sentence+1, 0))
    
    random.shuffle(ex_list)

    return ex_list