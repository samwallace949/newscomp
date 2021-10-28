const { Cluster } = require("puppeteer-cluster");
fs = require('fs');

//subset of query return
const sampleUrls = ["https://techncruncher.blogspot.com/2021/09/covid-19-pill-developers-aim-to-top.html",
"https://www.nytimes.com/2021/10/07/briefing/debt-ceiling-pfizer-nobel-prize.html",
"https://techncruncher.blogspot.com/2021/10/sweden-to-give-12-15-year-olds-pfizer.html",
"https://techncruncher.blogspot.com/2021/10/pfizers-covids-vaccine-over-90-effective.html",
"https://gizmodo.com/fda-advisory-panel-unanimously-backs-a-half-dose-modern-1847866919",
"https://www.nytimes.com/2021/10/07/us/politics/pfizer-fda-authorization-children-5-11.html",
"https://www.nytimes.com/2021/10/22/us/politics/pfizer-vaccine-children-covid.html",
"https://www.reuters.com/world/us/pfizer-biontech-ask-us-regulators-ok-covid-19-vaccine-kids-2021-10-07/",
"https://www.cnn.com/2021/10/09/health/pfizer-covid-vaccine-waning-questions-wellness/index.html",
"https://www.cnn.com/2021/10/21/health/pfizer-booster-dose-efficacy-wellness-bn/index.html",
"http://www.zacks.com/stock/news/1813428/are-investors-undervaluing-pfizer-pfe-right-now?cid=CS-ENTREPRENEUR-FT-tale_of_the_tape|yseop_template_2-1813428",
"https://www.bttoronto.ca/2021/09/30/ontario-recommending-pfizer-over-moderna-vaccine-for-young-adults/",
"https://consent.yahoo.com/v2/collectConsent?sessionId=1_cc-session_4dfde071-f19d-41b7-b241-ad24b456fe32",
"https://www.theglobeandmail.com/canada/article-ontario-recommends-pfizer-vaccine-in-males-age-18-24-to-reduce-risk-of/",
"https://ottawacitizen.com/news/local-news/ontario-recommends-young-adults-get-pfizer-over-moderna-vaccines",
"https://www.nytimes.com/2021/10/14/us/booster-shots-moderna-johnson-johnson-pfizer.html",
"https://www.nytimes.com/2021/10/01/opinion/letters/covid-booster-vaccines.html",
"https://www.elliotlaketoday.com/national-business/pfizer-asks-us-to-allow-covid-shots-for-kids-ages-5-to-11-4493806",
"https://www.republicworld.com/world-news/rest-of-the-world-news/canada-recommends-pfizer-over-moderna-due-to-low-rate-of-cardio-issues-for-ages-18-to-24.html",
"http://www.zacks.com/commentary/1813530/top-analyst-reports-for-microsoft-mastercard-pfizer?cid=CS-ENTREPRENEUR-FT-research_daily-1813530",
"https://www.reuters.com/business/healthcare-pharmaceuticals/novartis-extends-deal-make-pfizerbiontech-vaccines-2021-10-21/",
"https://www.reuters.com/video/watch/idRCV00AD6C",
"https://www.reuters.com/world/asia-pacific/malaysia-approves-use-pfizer-biontech-vaccine-booster-shot-2021-10-08/",
"https://www.reuters.com/world/americas/pfizer-study-vaccinate-whole-brazilian-town-against-covid-2021-10-06/",
"http://www.zacks.com/stock/news/1813428/are-investors-undervaluing-pfizer-pfe-right-now?cid=CS-ENTREPRENEUR-FT-tale_of_the_tape|yseop_template_2-1813428",
"https://www.reuters.com/world/europe/russian-vaccine-tourists-travel-serbia-pfizer-shot-2021-10-15/",
"https://www.reuters.com/world/uk/britain-secures-covid-19-antivirals-merck-pfizer-2021-10-20/",
"https://www.reuters.com/video/watch/idRCV00AAZ9",
"https://www.reuters.com/business/healthcare-pharmaceuticals/pfizer-begins-study-covid-19-antiviral-drug-2021-09-27/",
"https://www.reuters.com/business/healthcare-pharmaceuticals/pfizer-begins-study-mrna-flu-vaccine-2021-09-27/",
"https://www.reuters.com/video/watch/idPmRC?now=true",
"https://www.kitchenertoday.com/coronavirus-covid-19-local-news/pfizer-now-preferred-covid-19-vaccine-for-18-24-year-olds-ontario-4471238",
"https://www.news.com.au/national/nsw-act/news/canberra-records-31-new-covid19-cases-as-extra-financial-support-for-businesses-is-announced/news-story/862a42f5f76c20e1a2315f5ac2d199be",
"https://www.theglobeandmail.com/world/article-colorado-woman-who-wont-get-vaccinated-denied-transplant-2/",
"https://www.reuters.com/video/watch/idOVEWN2GSR",
"https://www.nytimes.com/2021/10/20/us/politics/fda-boosters-moderna-johnson-johnson.html",
"http://www.zacks.com/stock/news/1808080/the-zacks-analyst-blog-highlights-pfizer-american-tower-corp-intuitive-surgical-fidelity-national-information-services-and-fedex?cid=CS-ENTREPRENEUR-FT-press_releases-1808080",
"http://www.zacks.com/stock/news/1801019/the-zacks-analyst-blog-highlights-home-depot-salesforce-pfizer-sony-and-zoetis?cid=CS-ENTREPRENEUR-FT-press_releases-1801019",
"http://www.zacks.com/commentary/1807428/top-analyst-reports-for-pfizer-american-tower-intuitive-surgical?cid=CS-ENTREPRENEUR-FT-research_daily-1807428",
"https://www.theepochtimes.com/walgreens-responds-after-family-says-children-received-covid-19-vaccine-instead-of-flu-shot_4051067.html",
"https://techncruncher.blogspot.com/2021/10/nordic-countries-are-restricting-use-of.html",
"https://techncruncher.blogspot.com/2021/10/heart-inflammation-rates-higher-after.html",
"https://www.bradfordtoday.ca/national-news/moderna-asks-health-canada-to-authorize-booster-shot-of-its-covid-19-vaccine-4490010",
"https://steinbachonline.com/local/pfizer-to-seek-approval-for-its-vaccine-for-kids-as-young-as-five-in-about-a-week",
"http://www.zacks.com/stock/news/1804654/is-pfizer-pfe-a-great-value-stock-right-now?cid=CS-ENTREPRENEUR-FT-tale_of_the_tape|yseop_template_2-1804654",
"https://www.nytimes.com/2021/10/19/well/family/pregnancy-covid-booster.html",
"https://www.nytimes.com/2021/08/19/health/coronavirus-johnson-vaccine-booster.html",
"https://news.trust.org/item/20210928125401-hra40/",
"https://www.ctvnews.ca/health/coronavirus/pfizer-covid-19-vaccine-antibodies-disappear-in-many-by-7-months-study-shows-1.5609826",
"https://www.surreynowleader.com/news/pfizer-to-seek-vaccine-approval-for-canadians-as-young-as-five-in-about-a-week/",
"https://www.winnipegfreepress.com/arts-and-life/life/health/pfizer-submits-trial-data-on-vaccine-use-in-children-aged-5-to-11-to-health-canada-575445892.html",
"https://stockhouse.com/news/press-releases/2021/10/04/pfizer-and-biontech-receive-chmp-positive-opinion-for-covid-19-vaccine-booster",
"https://vancouversun.com/news/mixing-covid-vaccines-offer-high-level-of-protection-bccdc-data",
"https://www.pfizer.com/news/press-release/press-release-detail/pfizer-and-biontech-submit-initial-data-us-fda-pivotal",
"https://www.castanet.net/news/Canada/347447/Pfizer-submits-trial-data-on-vaccine-use-in-children-aged-5-to-11-to-Health-Canada",
"https://www.reuters.com/article/moderna-stocks-idUSL4N2QX2FA",
"https://www.reuters.com/world/europe/eu-says-mrna-vaccine-booster-may-be-given-those-with-weak-immunity-2021-10-04/",
"https://www.660citynews.com/2021/10/02/pfizer-submits-trial-data-on-vaccine-use-in-children-aged-5-11-to-health-canada/",
"https://financialpost.com/pmn/business-pmn/u-s-administers-nearly-396-mln-doses-of-covid-19-vaccines-cdc"];

function markTime(){
    return (new Date()).getTime()/1000;
}

function consumeArticles(tokenDict, urls){
    (async () => {

        const time1 = markTime();
    
        const cluster = await Cluster.launch({
            concurrency: Cluster.CONCURRENCY_PAGE,
            maxConcurrency: 8,
            monitor: true,
        });
    
        // Extracts document.title of the crawled pages
        await cluster.task(async ({ page, data: url }) => {
            await page.goto(url, { waitUntil: 'domcontentloaded' });
    
            const extractedText = await page.$eval('*', (el) => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNode(el);
                selection.removeAllRanges();
                selection.addRange(range);
                let elements = window.getSelection().toString().split("\n");
                // let tokens = elements.map((paragraph) => paragraph.split(/\W+/).length);
                // for(let i = 0; i < tokens.length;i++){
                //     for(let j = 0; j <tokens[i].length; j++){

                //         if(tokens[i][j] in tokenDict[url])tokenDict[url][tokens[i][j]] += 1;
                //         else tokenDict[url][tokens[i][j]] = 1;

                //     }
                // }
                return elements;
            }).then((res) => {
                tokenDict[url] = res;
                console.log("saved text to json object");
            }).catch(err =>{
                console.log("error scraping value:\n", err);
            });
        });
    
        // In case of problems, log them
        cluster.on('taskerror', (err, data) => {
            console.log(`  Error crawling ${data}: ${err.message}`);
        });
    
        // queue the urls
        for (let i = 0; i < urls.length; i++) {
            tokenDict[urls[i]] = [];
            cluster.queue(urls[i]);
        }
    
        await cluster.idle();
        await cluster.close();
    
        const time2 = markTime();
    
        console.log("task of scraping incoming URLs is complete in %d seconds", time2-time1);
        fs.writeFile("tokenSample.json", JSON.stringify(tokenDict), (err, res) =>{
            if(err) console.log("An Error occured:\n", err);
            else console.log("File Written Successfully!");
        });
        
    })();
}

let placeholder = {};

consumeArticles(placeholder, sampleUrls);


