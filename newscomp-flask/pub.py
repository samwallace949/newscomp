#no computation needed, doc -> publisher map saved in state['queryData']['metadata']
def compute(state):
    pass

#get list of distinct publishers 
def options(state):
    return list(set([state['metadata'][url]['publisher'] for url in state['raw'].keys()]))


def filter(state, publisher):
    out = []

    urls = list(state['raw'].keys())

    for url in urls:
        out.append(state['metadata'][url]['publisher'] == publisher)
    
    return out

def topk(state, docs, k=5):

    num_topics = len(state['topics'])

    pub_count = dict({})

    for url in docs:
        
        if state['metadata'][url]['publisher'] in pub_count:
            pub_count[state['metadata'][url]['publisher']] += 1
        else:
            pub_count[state['metadata'][url]['publisher']] = 1

    pub_count = list(pub_count.items())

    print("Pub count list: ", pub_count)

    out_length = min(len(pub_count), k)

    return sorted(pub_count, key = lambda a: a[1], reverse=True)[:out_length]

