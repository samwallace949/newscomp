from flask import Flask, jsonify
from flask import request
import requests

from filters import *
from stateUtils import *
from metrics import *


app = Flask(__name__)


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
    if update_current_article_data(result):

        status = requests.post("http://localhost:8080/queries/test-data/write", data=get_current_article_data())

        print("Resaved test data: ", status)

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

    filterId = make_filter(req['flist'])
    topk = get_topk(filterId, req['sortMetric'])

    return jsonify({"filterId":filterId, "topk":topk})

@app.route("/filter/topk", methods=["POST"])
def return_topk():

    req = request.get_json()

    topk = get_topk(req['fid'], req['sortMetric'])

    return jsonify({"topk":topk})