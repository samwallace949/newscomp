
import torch
import torch.nn as NN
from torch.nn.functional import normalize
from sentence_transformers import SentenceTransformer

#ordering of frame labels for classifier (unfortunately this cant be undone without retraining it)
keys = ['13.0','6.0','1.0','14.0','12.0','2.0','11.0','9.0','3.0','10.0','5.0','8.0','4.0','7.0','15.0']
    
codes = {
  "0": "None", 
  "1.0": "Economic", 
  "1.1": "Economic headline", 
  "1.2": "Economic primary", 
  "2.0": "Capacity and Resources", 
  "2.1": "Capacity and Resources headline", 
  "2.2": "Capacity and Resources primany", 
  "3.0": "Morality", 
  "3.1": "Morality headline", 
  "3.2": "Morality primary", 
  "4.0": "Fairness and Equality", 
  "4.1": "Fairness and Equality headline", 
  "4.2": "Fairness and Equality primary", 
  "5.0": "Legality, Constitutionality, Jurisdiction", 
  "5.1": "Legality, Constitutionality, Jurisdiction headline", 
  "5.2": "Legality, Constitutionality, Jurisdiction primary", 
  "6.0": "Policy Prescription and Evaluation", 
  "6.1": "Policy Prescription and Evaluation headline", 
  "6.2": "Policy Presecription and Evaluation primary", 
  "7.0": "Crime and Punishment", 
  "7.1": "Crime and Punishment headline", 
  "7.2": "Crime and Punishment primary", 
  "8.0": "Security and Defense", 
  "8.1": "Security and Defense headline", 
  "8.2": "Security and Defense primary", 
  "9.0": "Health and Safety", 
  "9.1": "Health and Safety headline", 
  "9.2": "Health and Safety primary", 
  "10.0": "Quality of Life", 
  "10.1": "Quality of life headline", 
  "10.2": "Quality of Life primary", 
  "11.0": "Cultural Identity", 
  "11.1": "Cultural Identity headline", 
  "11.2": "Cultural Identity primary", 
  "12.0": "Public Sentiment", 
  "12.1": "Public Sentiment headline", 
  "12.2": "Public Sentiment primary", 
  "13.0": "Political", 
  "13.1": "Political primary headline", 
  "13.2": "Political primary", 
  "14.0": "External Regulation and Reputation", 
  "14.1": "External regulation and reputation headline", 
  "14.2": "External Regulation and Reputation primary", 
  "15.0": "Other", 
  "15.1": "Other headline", 
  "15.2": "Other primary", 
  "16.2": "Irrelevant", 
  "17.35": "Implicit Pro", 
  "17.4": "Explicit Pro", 
  "18.3": "Neutral", 
  "19.35": "Implicit Anti", 
  "19.4": "Explicit Anti"
}


class SentenceClassifier(NN.Module):
    def __init__(self, labels):
        
        super().__init__()
        
        self.transformer = SentenceTransformer('sentence-transformers/all-distilroberta-v1')
        for params in self.transformer.parameters():
            params.requires_grad = False
        
        self.fc = NN.Linear(768, len(labels))
        self.logits = NN.Softmax()
        self.labels = labels
    
    def forward(self, x):
        return self.logits(self.fc(torch.tensor(self.transformer.encode(x))))

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model = SentenceClassifier(keys)
model.load_state_dict(torch.load("../ignored/distilberta-mfc-no-context.pt", map_location=device))
model.eval()


def compute(state):

    print("Calculating frame labels for each sentence")

    state['mfc1'] = dict({})
    for i, article in enumerate(state['raw']):
        print("Done with article {} of {}".format(i, len(state['raw'])))
        state['mfc1'][article] = model(state['raw'][article])
        print("Shape of article tensor:", state['mfc1'][article].shape)
        state['mfc1'][article] = state['mfc1'][article].tolist()
        
    
    
    
def options(state):

    out = {
        "params":{
            "code": 0,
            "threshold": 0.5
        },
        "categoricals":{
            "code": [codes[k] for k in keys]
        },
        "labels":{
            "code": "Frame Code: ",
            "threshold": "Frame Probability: "
        }
    }

    return out


def filter(state, params):
    out = dict({})

    target_key = None
    for key in codes:
        if codes[key] == params['code']:
            target_key = keys.index(key)
            break

    if target_key is None:
        print("Error: no matching frame key for that code.")

    urls = list(state['raw'].keys())

    for url in urls:
        
        if target_key is None:
            out[url] = [False]*len(state['raw'][url])

        sentence_probs = torch.tensor(state['mfc1'][url]).t()[target_key]
        sentence_validity_vals = torch.where(sentence_probs > float(params['threshold']), True, False).tolist()
        out[url] = sentence_validity_vals
    
    return out
    
def topk(state, sentences, k=15):

    frame_frequencies = torch.tensor([0]*len(keys))

    for doc in sentences:
        sent_probs_tensor = torch.tensor(state['mfc1'][doc])
        sent_probs_tensor = torch.index_select(sent_probs_tensor, 0, torch.tensor(sentences[doc], dtype=torch.long))
        norm_doc_probs = normalize(torch.sum(sent_probs_tensor, dim=0), dim=0, p=1)
        frame_frequencies = torch.add(frame_frequencies, norm_doc_probs)
    

    frame_frequencies = normalize(frame_frequencies, dim=0, p=1)
    norm_corpus_probs = [(codes[keys[i]], frame_frequencies[i].item()) for i in range(len(keys))]

    return sorted(norm_corpus_probs, key=lambda a:a[1], reverse=True)[:min(len(keys),k)]


def examples(state, code, sentences, k=5):

    target_idx = [codes[key] for key in keys].index(code)

    example_spans = []
    for doc in sentences:
        if len(sentences[doc]) == 0:
            continue
        #get index of maximally representative valid sentence in document and return it.
        sent_probs_tensor = torch.tensor(state['mfc1'][doc])[:, target_idx]
        sent_probs_tensor = torch.index_select(sent_probs_tensor, 0, torch.tensor(sentences[doc], dtype=torch.long))
        max_prob = torch.max(sent_probs_tensor).item()
        argmax_prob = sentences[doc][torch.argmax(sent_probs_tensor).item()]
        example_spans.append((doc, argmax_prob, argmax_prob + 1, max_prob))
        
    return sorted(example_spans, key = lambda a: a[-1], reverse=True)[:min(k, len(example_spans))]