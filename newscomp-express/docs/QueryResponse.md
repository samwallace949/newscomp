Response: Object{

    query: String,

    urls: [String],

    queryData: Object{

        raw: Object{
            $queryUrl: List[String] // the lists of paragraphs in this article beofre they are tokenized and stemmed
        },

        filtered: Object{

            tokenized: Object{ // the inverted index of the article
                $queryUrl: Object{
                    $term: List[Number] //indices paragrahs in which this term shows up
                }
            },

            vocabSet: List[String], //vocabulary set stored as a list

            unstemmed: Object: {
                $term: String //maps to one of the unstemmed variants of any given term in the vocab.
            }
        },

        metadata: Object{  //map for each article to its metadata
            $queryUrl: Object{
                date: Date  //the date that the article was published
                publisher: String  //the publisher of the article 
            }
        }
    },
    isTest: Boolean  //determines if this is the test data. Internal value used for storing this state in DB without duplicates.
}