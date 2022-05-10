import math
from datetime import date
import json

# import importlib

# FEATURE_NAMES = None
# with open("./loaded-modules.json", "r") as f:
#     MODULE_NAMES = json.load(f)

# FEATURE_MODULES = []
# FEATURE_NAMES = []
# for name in MODULE_NAMES:
#     try:
#         importlib.import_module(name)
#     except Exception as e:
#         print("Unable to load module", name)
#         print(e)
#         continue
#     FEATURE_NAMES.append(re.split("/", name)[-1][:-3])

import lda
import tf
import tfidf
import pub
import ner
import mfcBertNoContext as mfc1
#import mfcBertWithContext as mfc1
import mfcGroundTruth as frameLabels
import kMeans

# no NER, too slow
# FEATURE_NAMES = ["kMeans", "tf", "tfidf", "pub"]
# FEATURE_MODULES = [kMeans, tf, tfidf, pub]
FEATURE_NAMES = ["frameLabels", "tf", "tfidf", "lda", "ner", "pub", "mfc1"]
FEATURE_MODULES = [frameLabels, tf, tfidf, lda, ner, pub, mfc1]


#global variable for storing the current query data, used to
#uodate frontend as well as provide models with text
#SHOULD NOT BE KEPT; FLASK SESSIONS WITH REDIS/DYNAMO CACHE SHOULD BE USED ONCE APP IS DEPLOYED
state = dict({})


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


#updates the state given the text data from a query, returns True if new data was generated and stored
def update_current_article_data(data, calc_features=True):

    global state

    state = data



    #make the vocabulary a set again (stored and sent over connections as a list)
    state['queryData']['filtered']['vocabSet'] = set(state['queryData']['filtered']['vocabSet'])

    #make filter array to store the given filters
    state['filters'] = dict()
    state['nextFilterId'] = 0

    if calc_features:
        for i,feature in enumerate(FEATURE_MODULES):
            print("Now calculating metric ", FEATURE_NAMES[i])
            feature.compute(state['queryData'])

        state['topk'] = dict({})
        state['topk']['tfidf'] = calc_metrics(state['queryData']['filtered'], k=15, return_tfidf = True)
        state['topk']['tf'] = calc_metrics(state['queryData']['filtered'], k=15, return_tfidf = False)
    # except Exception as e:
    #     print("Failed To Calculate Metrics")
    #     raise e

    return True

#returns {params:{param:defaultVal}, categoricals:{param:allPossibleVals}}
def get_options(feature):
    return FEATURE_MODULES[FEATURE_NAMES.index(feature)].options(state['queryData'])


def make_filter(flist, is_sentence_level):
    
    urls = list(state['queryData']['raw'].keys())

    url_map = [True] * len(urls)

    #initialize dict of arrays for sentence filter passing, either with values of true or false for each sentence
    #based on whether or not the filter is finding the union or the interesection of validity at the sentence level
    valid_sentences = dict([(url, [is_sentence_level for sent in state['queryData']['raw'][url]]) for url in state['queryData']['raw'].keys()])

    for f in flist:

        print("Filter Data: ", f.items())

        new_filter = FEATURE_MODULES[FEATURE_NAMES.index(f['name'])].filter(state['queryData'], f)
        
        if new_filter == -1:#pass if module filter function is passed
            continue

        for url in valid_sentences.keys():
            if is_sentence_level:
                valid_sentences[url] = [valid_sentences[url][i] and new_filter[url][i] for i in range(len(valid_sentences[url]))]
            else:
                valid_sentences[url] = [valid_sentences[url][i] or new_filter[url][i] for i in range(len(valid_sentences[url]))]
    
    num_valid_docs = 0
    num_valid_sents = 0

    for url in valid_sentences.keys():
        is_valid_doc = False
        for sent in valid_sentences[url]:
            if sent:
                num_valid_sents += 1
                is_valid_doc = True
        if is_valid_doc:
            num_valid_docs += 1


    state['filters'][state['nextFilterId']] = valid_sentences

    state['nextFilterId'] += 1

    return num_valid_sents, num_valid_docs, state['nextFilterId'] - 1
    

def get_sentences_from_fid(fid, only_valid_sentences=True):

    if fid in state['filters']:
        #init return val with urls of all documents with at least one sentence passing filter
        sentence_ptr_dict = dict([(url, {}) for url in state['filters'][fid].keys()])

        for doc in state['filters'][fid]:
            #TODO: determine when doc has no valid sentences, dont include this doc when only_valid_sentences=False
            #add array to dict with valid sentence indices, either all sentences if whole doc is included or only valid sentences
            sentence_ptr_dict[doc] = [i for i in range(len(state['filters'][fid][doc])) if (not only_valid_sentences) or state['filters'][fid][doc][i]]

        print("Num Valid sentences in filter:", sum(len(sentences) for sentences in sentence_ptr_dict.values()))
        return sentence_ptr_dict

    #default return dict of pointers to all sentences in loaded corpus
    return dict([(url, list(range(len(state['queryData']['raw'][url])))) for url in state['queryData']['raw'].keys()])

def get_topk(fid, feature, is_sentence_level):
    
    topk = []

    valid_sentences = get_sentences_from_fid(fid, is_sentence_level)

    feature_mod = FEATURE_MODULES[FEATURE_NAMES.index(feature)]

    #CACHE TOPK BY FID AND FEATURE
    # if fid not in state['topk']:
    #     state['topk'][fid] = dict({})

    # if feature in state['topk'][fid]:
    #     print("Returned cached topk value for " + feature)
    #     topk = state['topk'][fid][feature]
    # else:
    #    
    #     state['topk'][fid][feature] = topk

    topk = feature_mod.topk(state['queryData'], valid_sentences)

    return topk

def get_current_article_data():
    return state


#runs function handler with state as JSON-serializable dict
def use_state_in_json(fn):
    #run actions necessary to make state serializable
    state['queryData']['filtered']['vocabSet'] = list(state['queryData']['filtered']['vocabSet'])
    #run function handle
    out = fn(state)
    #undo serializing ops
    state['queryData']['filtered']['vocabSet'] = list(state['queryData']['filtered']['vocabSet'])

    return out

#function returning sentences containing the selected keyword
def get_feature_examples(fid, feature, val):

    valid_sentences = get_sentences_from_fid(fid)

    example_tuples = FEATURE_MODULES[FEATURE_NAMES.index(feature)].examples(state["queryData"], val, valid_sentences)

    print("Num examples fetched: ", len(example_tuples))

    example_prefix = ["\n".join(state['queryData']['raw'][example[0]][:example[1]]) for example in example_tuples]
    example_subject = ["\n".join(state['queryData']['raw'][example[0]][example[1]:example[2]]) for example in example_tuples]
    example_suffix = ["\n".join(state['queryData']['raw'][example[0]][example[2]:]) for example in example_tuples]

    return [[example_prefix[i], example_subject[i], example_suffix[i]] for i in range(len(example_tuples))]

def print_state_keys():
    print("State Keys:")
    for key in state:
        print(key)

def get_query_and_topk():

    print_state_keys()

    try:
        return dict([ ("query",state["query"]), ("topk",state["topk"]) ])
    except:
        return dict([ ("query",""), ("topk",state["topk"]) ])





