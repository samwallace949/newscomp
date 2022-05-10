#no computation needed, doc -> publisher map saved in state['queryData']['metadata']
#return fase to signal that no features were generated, so state does not need to be saved to db
import random

# publisher data is already stored efficiently in loaded JSON data,
# so no features need be computed and stored.
def compute(state):
    return False

#get list of distinct publishers 
#returns {params:{param:defaultVal}, categoricals:{param:allPossibleVals}}
def options(state):
    
    #calculates all unique publishers for categorical parameter choices
    unique_pubs = set([state['metadata'][url]['publisher'] for url in state['raw']])

    out = {
        'params':{
            'publisher':0
        },
        'categoricals': {
            'publisher': list(unique_pubs)
        },
        'labels':{
            'publisher': "Publisher: "
        }
    }

    return out


def filter(state, params):

    #get list of doc urls in corpus
    urls = list(state['raw'].keys())

    #init returned dictionary
    out = dict({})

    #iterate over each document
    for url in urls:

        # is the publisher of this article the target?
        is_pub = state['metadata'][url]['publisher'] == params["publisher"]

        # append list of booleans to return val
        # based on whether or not this is the target pub
        # (boolean will be same for all sentences in one article)
        out[url] = [is_pub] * len(state['raw'][url])
    
    return out

def topk(state, sentences, k=5):

    # init counter dict
    pub_count = dict({})

    #for each doc in corpus subset
    for url in sentences:
        
        if len(sentences[url]) == 0:
            continue

        # if doc is not empty, increment count of doc's publisher

        if state['metadata'][url]['publisher'] in pub_count:
            pub_count[state['metadata'][url]['publisher']] += 1
        else:
            pub_count[state['metadata'][url]['publisher']] = 1

    # convert dict to list
    pub_count = list(pub_count.items())

    print("Pub count list: ", pub_count)

    out_length = min(len(pub_count), k)

    # return publisher counts, sorted by highest
    return sorted(pub_count, key = lambda a: a[1], reverse=True)[:out_length]

def examples(state, pub, sentences, k=5):

    urls = list(sentences.keys())

    # shuffle list of valid setnences, since each is weighted equally
    # and it would not be ideal to see the same examples every time
    random.shuffle(urls)

    out = []

    for doc in urls:

        if state['metadata'][doc]['publisher'] == pub:
            # add only 1 exemplary sentece per document
            try:
                #add first sentence to examples
                out.append((doc, sentences[doc][0], sentences[doc][0]+1, len(sentences[doc])))
            except:
                continue
        
        # we only want a certain number of examples,
        # terminate after reaching that number
        if len(out) == k:
            break
        
    return sorted(out, key=lambda a:a[-1], reverse=True)