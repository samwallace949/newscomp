
import torch
import torch.nn as NN
from transformers import RobertaModel, RobertaTokenizerFast
from torch.nn.functional import normalize

tokenizer = RobertaTokenizerFast.from_pretrained("roberta-base")


def calc_annotation_mask(offset_mapping, batch_bounds):
    token_spans = []
    for i, inp in enumerate(offset_mapping):

        start_idx = -1
        end_idx = -1

        for j, span in enumerate(inp):
            tok_start = span[0]
            tok_end = span[1]
            annotation_start = batch_bounds[i][0]
            annotation_end = batch_bounds[i][1]
            if tok_end > annotation_start and start_idx == -1:
                start_idx = j
            if tok_end > annotation_end:
                end_idx = j
                break
        token_spans.append([1 if i >= start_idx and i < end_idx else 0 for i in range(len(inp))])
    return token_spans

def find_attention_span(sentences, idx,tokenizer):

    inp_len = 513

    sents = [sent for sent in sentences]

    while True:
        tokenizer_inp = " ".join(sents)
        tokenized = tokenizer(tokenizer_inp, padding=True, return_offsets_mapping=True, return_tensors='pt')
        if tokenized["input_ids"].shape[1] > 512:
            if idx < len(sents)-1:
                sents = sents[:-1]
            else:
                sents = sents[1:]
                idx -= 1
        else:
            break
    
    print("Attention Span:", len(sents), "sentences")
    return sents, idx


def get_article_input(sentences,tokenizer,device):
    
    truncated_spans = [find_attention_span(sentences,idx,tokenizer) for idx in range(len(sentences))]
    tokenizer_inp = [x[0] for x in truncated_spans]
    indices = [x[1] for x in truncated_spans]
    batch_tokens = tokenizer([" ".join(t) for t in tokenizer_inp], padding=True, truncation=True, return_offsets_mapping=True, return_tensors='pt')
    bounds = [(len(tokenizer_inp[i][:indices[i]]), len(tokenizer_inp[i][:indices[i]+1])) for i in range(len(indices))]
    
    annotation_mask = calc_annotation_mask(batch_tokens["offset_mapping"], bounds)
    slice_tensor = torch.tensor(annotation_mask, dtype=torch.float)

    del batch_tokens["offset_mapping"]
    model_input = [batch_tokens.to(device), slice_tensor.to(device)]
    
    return model_input



class FullContextSpanClassifier(NN.Module):
    def __init__(self, labels, reporting=False):
        
        super().__init__()
        self.transformer = RobertaModel.from_pretrained("roberta-base")
        for params in self.transformer.parameters():
            params.requires_grad = False
        self.transformer.eval()
        self.fc = NN.Linear(768, len(labels))
        self.logits = NN.Softmax()
        self.labels = labels
        self.reporting=reporting
    
    def forward(self, x):
        tokens = x[0]
        indices = x[1]
        dims = list(indices.shape)
        indices = torch.flatten(indices)
        
        self.report("Data unpacked. running bigbird...")
        
        x = self.transformer(**tokens).last_hidden_state
        
        self.report("bigbird run. applying mask and summing...")
        
        x = torch.reshape(x, (dims[0]*dims[1], 768))
        self.report("mask shape:", indices.shape, "data shape:", x.shape)
        
        x = (x.t()*indices).t()
        self.report("after masking, data is of shape", x.shape)
        x = torch.reshape(x, (dims[0], dims[1], 768))
        
        x = torch.sum(x, dim=1)
        self.report("after summing, data is of shape", x.shape)
        
        x = normalize(x, dim=1)
        
        x = self.fc(x)
        
        x = self.logits(x)
        
        self.report("classifier run.")
        
        return x
    
    def report(self,*args):
        if self.reporting:
            print("(FullContextSpanClassifier): ", " ".join([str(x) for x in args]))
    
#ordering of frame labels for classifier (unfortunately this cant be undone without retraining it)
keys = ['1.0','2.0','3.0','4.0','5.0','6.0','7.0','8.0','9.0','10.0','11.0','12.0','13.0','14.0','15.0']
    
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
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

model = FullContextSpanClassifier(keys)
model.load_state_dict(torch.load("../ignored/roberta-mfc-no-context-ce-loss-epoch-1.pt", map_location=device))
model.eval()


def compute(state):

    print("Calculating frame labels for each sentence")

    state['mfc2'] = dict({})
    for i, article in enumerate(state['raw']):
        
        model_input = get_article_input(state['raw'][article], tokenizer, device)

        state['mfc2'][article] = model(model_input)
        print("Shape of article tensor:", state['mfc2'][article].shape)
        state['mfc2'][article] = state['mfc2'][article].tolist()
    
    
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

        sentence_probs = torch.tensor(state['mfc2'][url]).t()[target_key]
        sentence_validity_vals = torch.where(sentence_probs > float(params['threshold']), True, False).tolist()
        out[url] = sentence_validity_vals
    
    return out
    
def topk(state, sentences, k=15):

    frame_frequencies = torch.tensor([0]*len(keys))

    for doc in sentences:
        sent_probs_tensor = torch.tensor(state['mfc2'][doc])
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
        sent_probs_tensor = torch.tensor(state['mfc2'][doc])[:, target_idx]
        sent_probs_tensor = torch.index_select(sent_probs_tensor, 0, torch.tensor(sentences[doc], dtype=torch.long))
        max_prob = torch.max(sent_probs_tensor).item()
        argmax_prob = sentences[doc][torch.argmax(sent_probs_tensor).item()]
        example_spans.append((doc, argmax_prob, argmax_prob + 1, max_prob))
        
    return sorted(example_spans, key = lambda a: a[-1], reverse=True)[:min(k, len(example_spans))]

