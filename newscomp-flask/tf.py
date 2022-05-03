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

    term_stemmed = ps.stem(params['term'].lower())

    filtered = state['filtered']

    sentences = dict([(url,[]) for url in state['raw'].keys()])

    for i,url in enumerate(sentences):

        sentence_counts = [0] * len(state['raw'][url])

        if term_stemmed in filtered['tokenized'][url]:
            print("searched term is in document")
            for sent_idx in filtered['tokenized'][url][term_stemmed]:
                sentence_counts[sent_idx] += 1
        elif i == 0:
            print(list(filtered['tokenized'][url].keys()))
        sentences[url] = [count >= int(params['threshold']) for count in sentence_counts]
    
    return sentences

def topk(state, sentences, k=15):

    filtered = state['filtered']
    tfs = {}

    for term in filtered['vocabSet']:

        tf = 0

        #technically a brute-force, but the term-sentence index means that searching for a sentence index should not be too hard
        for doc in sentences:
            if term in filtered['tokenized'][doc]:
                for sentence in filtered['tokenized'][doc][term]:
                    if sentence in sentences[doc]:
                        tf += 1

        tfs[term] = tf

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