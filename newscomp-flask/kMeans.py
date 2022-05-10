import numpy as np

import spacy
import re
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, normalize
from numpy.linalg import norm


min_doc_len = 10

nlp = spacy.load("en_core_web_lg")

def compute(state):

    urls = list(state['raw'].keys())
    
    all_sentence_embeddings = None

    embedding_to_sentence_map = []
    sentence_to_embedding_map = dict([(url, []) for url in state['raw']])
    
    for j, url in enumerate(urls):
        
        print("Done with {} of {} articles".format(j, len(urls)))

        for i, sentence in enumerate(state['raw'][url]):

            sentence_to_embedding_map[url].append(len(embedding_to_sentence_map))
            embedding_to_sentence_map.append([url, i])
            
            single_sentence_embedding = None

            if len(sentence) > min_doc_len:
                single_sentence_embedding = nlp(sentence).vector[:,np.newaxis].T
            else:
                single_sentence_embedding = np.zeros([1,300])

            if all_sentence_embeddings is None:
                all_sentence_embeddings = single_sentence_embedding
            else:
                all_sentence_embeddings = np.concatenate((all_sentence_embeddings, single_sentence_embedding), axis=0)

    model = KMeans(n_clusters=15)
    scaler = StandardScaler()
    norm_sent_data = scaler.fit_transform(all_sentence_embeddings)
    model.fit(norm_sent_data)

    centroids = model.cluster_centers_
    centroid_norms = norm(centroids, axis = 1)

    print("Centroid Norms:", centroid_norms)

    sent_norms = norm(norm_sent_data, axis=1)

    sims = []

    eps = np.array([0.0001] * sent_norms.shape[0])

    for i,centroid in enumerate(centroids):
        
        #euclidean distance, normalized relative to max
        sims.append(norm(norm_sent_data-centroid, axis=1))

        print("For centroid {}, min distance is {} and max_distance is {}".format(i, np.max(sims[-1]), np.min(sims[-1])))
        #cosine similarity
        #sims.append((all_sentence_embeddings @ centroid)/((sent_norms*centroid_norms[i]) + eps))

    dist_max = max(np.max(cluster) for cluster in sims)
    sims = [1-(cluster/dist_max) for cluster in sims]

    state['clusters'] = []

    exemplar_indices = [embedding_to_sentence_map[np.argmax(sim)] for sim in sims]
    for url, sent_idx in exemplar_indices:
        state['clusters'].append(state['raw'][url][sent_idx])

    state['cluster_sims'] = [sent_probs.tolist() for sent_probs in sims]
    state['cluster_sentence_map'] = embedding_to_sentence_map
    state['sentence_cluster_map'] = sentence_to_embedding_map



def options(state):

    out = {
        'params':{
            'cluster':0
        },
        'categoricals': {
            'cluster': state['clusters']
        },
        'labels':{
            'cluster': "Cluster: "
        }
    }

    return out



def filter(state, params):

    cluster_idx = state['clusters'].index(params['cluster'])
    
    closest_cluster = np.argmax(np.array(state['cluster_sims']).T, axis=1)
    print("Array of integers to closest clusters is of shape", closest_cluster.shape)
    cluster_valids = np.where(closest_cluster == cluster_idx, True, False).tolist()

    out = dict([(url, [False] * len(state['raw'][url])) for url in state['raw']])

    for i, is_valid in enumerate(cluster_valids):
        if is_valid:
            curr_url, curr_sent = state['cluster_sentence_map'][i]
            out[curr_url][curr_sent] = True
    
    return out



def topk(state, sentences, k=15):

    cum_cluster_sims = [0] * len(state['cluster_sims'])

    sim_matrix = np.array(state["cluster_sims"])

    for doc in sentences:
        for sent in sentences[doc]:

            embedding_idx = state["sentence_cluster_map"][doc][sent]
            cum_cluster_sims[np.argmax(sim_matrix[:, embedding_idx])] += 1

    cluster_tuples = [(state['clusters'][i], sim) for i,sim in enumerate(cum_cluster_sims)]

    return sorted(cluster_tuples, key=lambda a:a[1], reverse=True)[:min(k, len(cluster_tuples))]

def examples(state, cluster, sentences, k=5):

    cluster_idx = state['clusters'].index(cluster)
    sim_matrix = np.array(state['cluster_sims'])
    out = []

    for doc in sentences:
        for sent in sentences[doc]:
            
            embedding_idx = state["sentence_cluster_map"][doc][sent]
            if np.argmax(sim_matrix[:, embedding_idx]) == cluster_idx:
                out.append((doc, sent, sent+1, sim_matrix[cluster_idx, embedding_idx]))


    return sorted(out, key=lambda a:a[-1], reverse=True)[:min(k, len(out))]
        
    

    