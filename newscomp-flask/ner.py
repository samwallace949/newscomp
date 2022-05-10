base_url = "../ignored/rel/data"

from REL.mention_detection import MentionDetection
from REL.utils import process_results
from REL.entity_disambiguation import EntityDisambiguation
from REL.ner import Cmns, load_flair_ner

wiki_version = "wiki_2019"

mention_detection = MentionDetection(base_url, wiki_version)
tagger_ner = load_flair_ner("ner-fast")

config = {
        "mode": "eval",
        "model_path": base_url + "/ed-wiki-2019/lr_model.pkl",
    }

model = EntityDisambiguation(base_url, wiki_version, config)

def compute(state, recompute=False):

    print("computing named entities...")

    if not recompute and 'entities' in state:

        print("Entities already computed, using cached features")

        return False

    urls = list(state['raw'].keys())
    
    entity_index = dict({})
    
    for i,url in enumerate(urls):
        
        print("computing metions for doc {} of {}".format(i, len(urls)))
        
        ner_input = dict([(i, [sent,[]]) for i, sent in enumerate(state['raw'][url])])
    
        ner_output, n_outputs = mention_detection.find_mentions(ner_input, tagger_ner)
        preds,_ = model.predict(ner_output)

        for sent in preds:
            for mention in preds[sent]:
                
                pred = mention['prediction']
                
                if pred not in entity_index:
                    entity_index[pred] = dict({})
                
                if url not in entity_index[pred]:
                    entity_index[pred][url] = []
                    
                entity_index[pred][url].append(sent)
    
    state['entities'] = entity_index

    return True
    
        

def options(state):

    num_mentions = lambda a: sum([len(docs_mentioned_in) for docs_mentioned_in in state['entities'][a].keys()])
    

    out = {
        'params':{
            'ent':0,
            'threshold':0
        },
        'categoricals':{
            'ent': sorted(list(state['entities'].keys()), key=num_mentions, reverse = True) if state['entities'] is not None else []
        },
        'labels':{
            'ent': "Named Entity Specified: ",
            'threshold': "Minimum Occurrances: "
        }
    }

    return out
        
def filter(state, params):

    urls = list(state['raw'].keys())
    
    threshold = int(params['threshold'])

    out = dict([(url, []) for url in urls])
    
    for i, url in enumerate(urls):

        sentence_ent_counts = [0] * len(state['raw'][url])
        if url in state['entities'][params['ent']]:
            for sentence_mentioned_in in state['entities'][params['ent']][url]:
                sentence_ent_counts[sentence_mentioned_in] += 1

        out[url] = [count >= threshold for count in sentence_ent_counts]
            
    return out
    

def topk(state, sentences, k=15):
    
    
    top_dict = dict({})

    for doc in sentences:

        sent_set = set(sentences[doc])

        for ent in state['entities']:

            if doc in state['entities'][ent]:
                
                for sent in state['entities'][ent][doc]:
                    
                    if sent in sent_set:
                        if ent not in top_dict:
                            top_dict[ent] = 0
                        top_dict[ent] += 1
                    

    out = sorted(list(top_dict.items()), key = lambda a: a[1], reverse = True)

    return out[:min(k, len(out))]

def examples(state,ent,sentences,k=5):

    example_spans = []

    for doc in sentences:
        sent_set = set(sentences[doc])
        if doc in state['entities'][ent]:
            for sent_idx in state['entities'][ent][doc]:
                if sent_idx in sent_set:
                    print("Adding example", state['raw'][doc][sent_idx])
                    example_spans.append((doc, sent_idx, sent_idx+1, 0))
                    break
                    #only return one example per document

    return example_spans[:min(k, len(example_spans))]