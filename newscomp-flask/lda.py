import json
import spacy
from gensim import corpora
import re
from gensim.models import LdaModel

nlp = spacy.load("en_core_web_sm")

#given queryData, computes lda topics and topic probabilities for each document
def compute(state):

    token_lists = get_lemmatized_tokens(state,nlp)
    topic_terms, doc_probs = lda_k_topics(token_lists)

    urls = list(state['raw'].keys())
    
    state['lda'] = dict({}) # empty the state's lda object

    for i, url in enumerate(urls):
        state['lda'][url] = dict(doc_probs[i])
    
    state['topics'] = topic_terms
    
def options(state):
    if state['topics'] is not None:
        return state['topics']
    return []


def filter(state, topic, threshold):
    out = []

    urls = list(state['raw'].keys())

    for url in urls:
        out.append(topic in state['lda'][url] and state['lda'][url][topic] > threshold)
    
    return out

def topk(state, docs, k=5):

    num_topics = len(state['topics'])

    k = min(k, num_topics)

    sum_probs = [0]*num_topics

    for url in docs:
        for i in range(num_topics):
            if i in state['lda'][url]:
                sum_probs[i] += state['lda'][url][i]

    avg_probs = [(state['topics'][i], sum_probs[i]/len(docs)) for i in range(num_topics)]

    return sorted(avg_probs, key = lambda a: a[1], reverse=True)[:k]


def is_not_sword_or_punc(word):
    return word not in nlp.Defaults.stop_words and not re.match(r"\W+", word) and len(word) > 1

def get_lemmatized_tokens(data, nlp):
    urls = list(data['raw'].keys())
    
    token_lists = []
    
    for url in urls:
        
        intermediate_list = []
        
        for paragraph in data['raw'][url]:
            intermediate_list = intermediate_list + re.split(r"\W+", paragraph)
        
        intermediate_string = " ".join(intermediate_list)
        
        spacy_doc = nlp(intermediate_string)
        
        token_lists.append([token.lemma_ for token in spacy_doc if is_not_sword_or_punc(token.lemma_)])
        
    return token_lists


def lda_k_topics(token_lists, k = 4):
    
    vocab = corpora.Dictionary(token_lists)

    corpus = [vocab.doc2bow(doc) for doc in token_lists]

    model = LdaModel(corpus, num_topics = k)
    
    topics = model.top_topics(corpus = corpus, dictionary = vocab)
    
    topic_terms = []
    
    for i,topic in enumerate(topics):
            
        topic_terms.append(", ".join([vocab[int(term[1])] for term in topic[0][:5]])) 
        
        print("\nTOPIC\n {}".format(i+1), topic_terms[-1])
       
    doc_probs = [model[doc] for doc in corpus]
    
    for i,topic in enumerate(doc_probs):
        print("Probs for Doc {}: ".format(i), topic)

    return topic_terms, doc_probs

