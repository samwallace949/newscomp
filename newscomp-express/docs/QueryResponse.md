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

            paragraphs: Object{
                $queryUrl: List[String] //plaintext list of the paragraphs (kept for easy context fetching)
            },

            vocabSet: List[String], //vocabulary set stored as a list

            unstemmed: Object: {
                $term: String //maps to one of the unstemmed variants of any given term in the vocab.
            }
        }
    },

    dateTo: Date,
    dateFrom: Date,

    topk: List[
        List[
            term: String,
            count: Number 
        ]
    ],

    isTest: Boolean
}