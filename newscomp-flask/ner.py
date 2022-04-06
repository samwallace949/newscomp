base_url = "../rel/data"

from REL.mention_detection import MentionDetection
from REL.utils import process_results
from REL.entity_disambiguation import EntityDisambiguation
from REL.ner import Cmns, load_flair_ner

wiki_version = "wiki_2019"

mention_detection = MentionDetection(base_url, wiki_version)
tagger_ner = load_flair_ner("ner-fast")

def compute(state):

    print("computing named entities...")

    if 'entities' in state:

        print("Entities already computed, using cached features")

        return False

    urls = list(state['raw'].keys())
    
    entity_index = dict({})
    
    ner_input = dict([(url, [' '.join(state['raw'][url]),[]]) for url in urls])
    
    ner_output, n_outputs = mention_detection.find_mentions(ner_input, tagger_ner)
    
    config = {
        "mode": "eval",
        "model_path": base_url + "/ed-wiki-2019/lr_model.pkl",
    }

    model = EntityDisambiguation(base_url, wiki_version, config)
    preds,_ = model.predict(ner_output)
    
    for url in preds:
        
        for mention in preds[url]:
            
            pred = mention['prediction']
            
            if pred not in entity_index:
                entity_index[pred] = dict({})
            
            if url not in entity_index[pred]:
                entity_index[pred][url] = 0
                
            entity_index[pred][url] += 1
     
    state['entities'] = entity_index

    return True

def options(state):

    num_mentions = lambda a: sum([count for count in state['entities'][a].values()])
    
    if state['entities'] is not None:
        return sorted(list(state['entities'].keys()), key=num_mentions, reverse = True)
    return []
        
def filter(state, ent, threshold):

    print("Threshold: ", threshold)
    print("Threshold Type: ", type(threshold))

    urls = list(state['raw'].keys())
    
    out = [True]*len(urls)
    
    for i, url in enumerate(urls):

        if url not in state['entities'][ent] or state['entities'][ent][url] < int(threshold):
            out[i] = False
            
    return out
    

def topk(state, docs, k=5):
    
    
    top_dict = dict({})
    
    for ent in state['entities']: 
    
        for doc in docs:

            if doc in state['entities'][ent]:
                
                if ent not in top_dict:
                    top_dict[ent] = 0
                    
                top_dict[ent] += state['entities'][ent][doc]
    

    out = sorted(list(top_dict.items()), key = lambda a: a[1], reverse = True)

    return out[:min(k, len(out))]
