import json
import spacy
from gensim import corpora
import re
from gensim.models import LdaModel

nlp = spacy.load("en_core_web_sm")

#TODO: make the needed changes to the options function for this module

#given queryData, computes lda topics and topic probabilities for each document
def compute(state):

    if 'topics' in state and 'lda' in state:

        print("Topics already computed, using cached features")

        return False

    sentence_token_lists = get_lemmatized_sentences(state,nlp)
    topic_labels, vocab, model = lda_k_topics(sentence_token_lists)

    urls = list(state['raw'].keys())
    
    state['lda'] = dict({}) # empty the state's lda object

    for i, url in enumerate(urls):
        #TODO: Calculate sentence-level doc probs
        sentence_topic_probs = [model[vocab.doc2bow(sentence)] for sentence in sentence_token_lists[url]]

        #cast float32 to python float for val, save doc probs as dicts in state float(str(val)))
        sentence_topic_probs = [dict([(key, float(str(val))) for key,val in tp]) for tp in sentence_topic_probs]

        state['lda'][url] = sentence_topic_probs


    state['topics'] = topic_labels

    return True


#params = {topic, threshold}
#categoricals = {topic}
#labels = {"Topic:", "Threshold: "}
def options(state):

    out = {
        "params":{
            "topic":0,
            "threshold":0.5
        },
        "categoricals":{
            "topic": state['topics'] if state['topics'] is not None else []
        },
        "labels":{
            "topic": "Topic: ",
            "threshold": "Minimum Document Probability: "
        }
    }

    return out


def filter(state, params):
    out = dict({})

    urls = list(state['raw'].keys())

    for url in urls:
        out[url] = [params['topic'] in sent and sent[params['topic']] for sent in state['lda'][url]]
    
    return out

def topk(state, sentences, k=5):#TODO: Make sentence level

    num_topics = len(state['topics'])

    k = min(k, num_topics)

    sum_probs = [0]*num_topics

    num_sentences = 0

    for url in sentences:
        for sent in sentences[url]:
            for topic in state['lda'][url][sent]:

                num_sentences += 1

                #if topic was saved to json, integer key casted to string
                topic_idx = int(topic)
                sum_probs[topic_idx] += state['lda'][url][sent][topic]



    avg_probs = [(state['topics'][i], (sum_probs[i]/num_sentences) if num_sentences > 0 else 0) for i in range(num_topics)]

    return sorted(avg_probs, key = lambda a: a[1], reverse=True)[:k]

def examples(state, topic, sentences, k=5):#TODO:make sentence level

    idx = state['topics'].index(topic) 

    doc_probs = []

    for url in sentences:
        for sentence in sentences[url]:
            if idx in state['lda'][url][sentence]:
                doc_probs.append((url, sentence, sentence + 1, state['lda'][url][sentence][idx]))
            elif str(idx) in state['lda'][url][sentence]:#if state was loaded from json, the index is going to be a string.
                doc_probs.append((url, sentence, sentence + 1, state['lda'][url][sentence][str(idx)]))

    return sorted(doc_probs, key = lambda a: a[-1], reverse=True)[:min(k, len(doc_probs))]



def is_not_sword_or_punc(word):
    return word not in nlp.Defaults.stop_words and not re.match(r"\W+", word) and len(word) > 1

def get_lemmatized_sentences(data, nlp):
    urls = list(data['raw'].keys())
    
    token_lists = dict({})
    
    for url in urls:
        doc_tokens = []
        for sentence in data['raw'][url]:
            lower_sent = sentence.lower()
            doc_tokens.append([token.lemma_ for token in nlp(lower_sent) if is_not_sword_or_punc(token.lemma_)])

        token_lists[url] = doc_tokens
        
    return token_lists


def lda_k_topics(sentence_token_lists, k = 4):
    
    doc_token_lists = []
    for doc in sentence_token_lists:
        intermediate_doc_list = []
        for sentence in sentence_token_lists[doc]:
            intermediate_doc_list = intermediate_doc_list+sentence
        doc_token_lists.append(intermediate_doc_list)

    vocab = corpora.Dictionary(doc_token_lists)

    corpus = [vocab.doc2bow(doc) for doc in doc_token_lists]

    model = LdaModel(corpus, num_topics = k)
    
    topics = model.top_topics(corpus = corpus, dictionary = vocab)
    
    topic_terms = []
    
    for i,topic in enumerate(topics):
            
        topic_terms.append(", ".join([vocab[int(term[1])] for term in topic[0][:5]])) 
        
        print("\nTOPIC\n {}".format(i+1), topic_terms[-1])

    return topic_terms, vocab, model

