#no computation needed, doc -> publisher map saved in state['queryData']['metadata']
#return fase to signal that no features were generated, so state does not need to be saved to db

PARAMS = [("publisher", "string")]
import random
def compute(state):
    return False

#get list of distinct publishers 
#returns {params:{param:defaultVal}, categoricals:{param:allPossibleVals}}
def options(state):
    
    out = {
        'params':{
            'publisher':0
        },
        'categoricals': {
            'publisher': list(set([state['metadata'][url]['publisher'] for url in state['raw'].keys()]))
        },
        'labels':{
            'publisher': "Publisher: "
        }
    }

    return out


def filter(state, params):

    urls = list(state['raw'].keys())

    out = dict([(url, []) for url in state['raw'].keys()])

    for url in urls:
        out[url] = [state['metadata'][url]['publisher'] == params["publisher"] for sentence in state['raw'][url]]
    
    return out

def topk(state, sentences, k=5):

    pub_count = dict({})

    for url in sentences:
        
        if len(sentences[url]) == 0:
            continue

        if state['metadata'][url]['publisher'] in pub_count:
            pub_count[state['metadata'][url]['publisher']] += 1
        else:
            pub_count[state['metadata'][url]['publisher']] = 1

    pub_count = list(pub_count.items())

    print("Pub count list: ", pub_count)

    out_length = min(len(pub_count), k)

    return sorted(pub_count, key = lambda a: a[1], reverse=True)[:out_length]

def examples(state, pub, sentences, k=5):

    urls = list(sentences.keys())
    random.shuffle(urls)

    out = []

    for doc in urls:

        if state['metadata'][doc]['publisher'] == pub:
            # add only 1 exemplary sentece per document
            out.append((doc, sentences[doc][0], sentences[doc][0]+1, len(sentences[doc])))
        
        if len(out) == k:
            break
        
    return sorted(out, key=lambda a:a[-1], reverse=True)