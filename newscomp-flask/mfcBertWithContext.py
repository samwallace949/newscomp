
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
model.load_state_dict(torch.load("../ignored/distilberta-mfc-with-context.pt", map_location=device))
model.eval()


def compute(state):

    print("Calculating frame labels for each sentence")

    state['mfc2'] = dict({})
    for i, article in enumerate(state['raw']):
        start_idx = len(" ".join(state['raw'][article][:i]))
        end_idx = start_idx + len(state['raw'][article][:i])
        bounds = [[start_idx, end_idx]]
        print("Done with article {} of {}".format(i, len(state['raw'])))
        inp = tokenizer(" ".join(state['raw'][article]), return_offsets_mapping=True, return_tensors='pt')
        token_span = calc_annotation_mask(inp["offset_mapping"], bounds)
        mask_tensor = torch.tensor(token_span)
        output = model([inp, mask_tensor])
        logits = torch.argmax(output, dim = 1)
        state['mfc1'][article] = [keys[logits[i].item()] for i in range(len(state['raw'][article]))]
        
    
    
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


def filter(state, code):
    out = []

    target_key = None
    for key in codes:
        if codes[key] == code:
            target_key = key
            break


    urls = list(state['raw'].keys())

    if target_key is None:
        return [False]*len(urls)

    for url in urls:
        frame_set = set(state['mfc2'][url])
        #chack for basic binary containment of this frame
        out.append(target_key in frame_set)
    
    return out
    
def topk(state, docs, k=15):

    frame_frequencies = dict([(codes[key], 0) for key in keys])

    for doc in docs:

        for frame in state['mfc2'][doc]:
            frame_frequencies[codes[frame]] += 1
    
    return sorted(frame_frequencies.items(), key=lambda a:a[1], reverse=True)[:k]

    
def examples(state, code, docs, k=5):
    pass

