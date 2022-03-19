from flask import Flask, jsonify
from flask import request
import requests

from stateUtils import *


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

    update_current_article_data(result)

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
