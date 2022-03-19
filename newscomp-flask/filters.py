from stateUtils import *

import spacy

#nlp = spacy.load("en_core_web_md")

def topic_filter_options(urls, filter_ref):
    pass

def make_topic_filter(choice, filter_ref, threshold = 0.6):
    if choice < 0 or choice > len(filter_ref['topics']):
        raise "Topic to filter by is not found."



#remove filter from state given filter id
def remove_filter(filter_ref, filter_idx):
    pass

def add_filter(filter_fn, filter_ref):
    pass

def pub_filter_options():
    pass
#add filter to the data accessible to the frontend, return id to filter used for deleting in the future.
def make_pub_filter(include, name):
    state['filters'].append(dict({'attr':'publisher', 'name':name, 'include': include}))

    calculate_valid_urls()

    return len(state['filters'])


# def get_date_range():

#     min_time = date.max

#     max_time = date.min

#     if len(state['valid_urls']) == 0:
#         return date.isoformat(date.today), date.isoformat(date.today)

#     for url in state['valid_urls']:

#         published_date = date.fromisoformat( state['queryData']['metadata'][url]['date'] )

#         if published_date > max_time:
#             max_time = published_date
        
#         if published_date < min_time:
#             min_time = published_date
        


#     return date.isoformat(min_time), date.isoformat(max_time)