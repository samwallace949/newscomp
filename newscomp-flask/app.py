from flask import Flask, jsonify
from flask import request
import requests

import json

from filters import *
from stateUtils import *
from metrics import *


app = Flask(__name__)
SAVE_OFFLINE_DATA_FEATURES = False
SAVE_TEST_DATA_FEATURES = False

OFFLINE_DATA_FEATURES_LOCATION = "../ignored/offline_features.json"

with open("../ignored/local-data-info.json", "r") as f:
    file_params = json.load(f)
    OFFLINE_DATA_FEATURES_LOCATION = "../ignored/" + file_params['featurefile']

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"





@app.route("/queries", methods=["POST"])
def make_query():

    result = requests.post("http://localhost:8080/queries", json = request.json).json()

    print("Label for whether this is the test data: " + str(result['isTest']))

    if result['success'] == False:
        raise Exception(result['error'])

    print(result.keys())

    update_current_article_data(result)

    return jsonify(get_query_and_topk())


@app.route("/queries/test-data/read", methods=["GET"])
def loadTestData():

    result = requests.get("http://localhost:8080/queries/test-data/read").json()

    #update the current state, and if metrics are generated, save the resulting metrics back to DB
    if update_current_article_data(result) and SAVE_TEST_DATA_FEATURES:

        #status = requests.post("http://localhost:8080/queries/test-data/write", json=get_current_article_data()).json()

        print("Resaved test data: ", status)

    print("Result Keys: ")
    for key in list(result.keys()):
        print(key)

    return jsonify(get_query_and_topk())

@app.route("/queries/offline/read", methods = ["GET"])
def loadOfflineData():

    result = requests.get("http://localhost:8080/queries/offline/read").json()

    #update the current state, and if metrics are generated, save the resulting metrics back to DB
    if update_current_article_data(result) and SAVE_OFFLINE_DATA_FEATURES:

        #post_fn = lambda a: requests.post("http://localhost:8080/queries/offline/features/write", json=a).json()
        def post_fn(state):
            with open(OFFLINE_DATA_FEATURES_LOCATION, "w") as f:
                json.dump(state,f)

        #send JSON test data to node or save locally using the inline function above
        status = use_state_in_json(post_fn)

        print("Resaved test data: ", status)

    print("Result Keys: ")
    for key in list(result.keys()):
        print(key)

    return jsonify(get_query_and_topk())

@app.route("/queries/offline/features/read", methods = ["GET"])
def loadOfflineDataFeatures():

    #result = requests.get("http://localhost:8080/queries/offline/features/read").json()
    result=None
    with open(OFFLINE_DATA_FEATURES_LOCATION, "r") as f:
        result = json.load(f)

    #update the current state, and if metrics are generated, save the resulting metrics back to DB
    update_current_article_data(result, calc_features=False)

    print("Result Keys: ")
    for key in list(result.keys()):
        print(key)

    return jsonify(get_query_and_topk())


#passthrough to node
#TODO: migrate indexing logic to python
@app.route("/queries/contextualized/<term>", methods=["GET"])
def get_contexts(term):
    
    out = get_term_contexts(term, 20)
    print(out)
    return jsonify(out)


@app.route("/filter/names", methods=["GET"])
def get_filter_names(): 
    return jsonify(FEATURE_NAMES)

@app.route("/filter/options/<feature>", methods=["GET"])
def get_feature_options(feature):

    options = get_options(feature)

    return jsonify({"feature":feature, "options":options})

@app.route("/filter/create", methods=["POST"])
def create_filter_return_topk():
    req = request.get_json()

    num_sentences, num_docs, filterId = make_filter(req['flist'], req['filterSentenceLevel'])
    topk = get_topk(filterId, req['sortMetric'], req['topkSentenceLevel'])

    return jsonify({"filterId":filterId, "topk":topk, "numSentences":num_sentences, "numDocs":num_docs})

@app.route("/filter/topk", methods=["POST"])
def return_topk():

    req = request.get_json()

    topk = get_topk(req['fid'], req['sortMetric'], req['topkSentenceLevel'])

    return jsonify({"topk":topk})

@app.route("/filter/examples", methods=["POST"])
def return_sample_results():

    req = request.get_json()

    examples = get_feature_examples(req['fid'], req['sortMetric'], req['metricVal'])

    return jsonify({"examples":examples})