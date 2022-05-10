import json


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

def compute(state):

    with open("../ignored/span_data.json", "r") as f:
        span_dict = json.load(f)
        state["frame_reals"] = dict({})
        for url in state['raw']:
            try:
                state['frame_reals'][url] = [sorted(codes) for codes in span_dict[url]]
            except:
                print("Article", url, "does not exist in annotation dictionary.")
                continue
    
def options(state):

    out = {
        "params":{
            "code": 0
        },
        "categoricals":{
            "code": [codes[k] for k in keys]
        },
        "labels":{
            "code": "Frame Code: "
        }
    }

    return out

def filter(state, params):

    target_key = float(keys[[codes[key] for key in keys].index(params["code"])])

    out = dict([(url, [False]*len(state['frame_reals'][url])) for url in state['frame_reals']])

    for url in out:
        for i in range(len(out[url])):
            if target_key in state['frame_reals'][url][i]:
                out[url][i] = True
    
    return out

def topk(state, sentences, k=15):

    out = dict([(codes[key],0) for key in keys])

    for doc in sentences:
        for sent in sentences[doc]:
            for frame in state['frame_reals'][doc][sent]:
                out[codes[str(frame)]] += 1
    
    return sorted(list(out.items()), key=lambda a:a[1], reverse=True)

def examples(state, code, sentences, k=15):
    
    out = []
    
    target_key = float(keys[[codes[key] for key in keys].index(code)])

    for doc in sentences:
        for sent in sentences[doc]:
            if target_key in state['frame_reals'][doc][sent]:
                out.append([doc, sent, sent+1, 0])
                break#only one example per document
    
    return out