
const { Cluster } = require("puppeteer-cluster");

function markTime(){
    return (new Date()).getTime()/1000;
}

module.exports.consumeArticles = async function (urls){

    let tokenDict = {};

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

            //select entire page
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNode(el);
            selection.removeAllRanges();
            selection.addRange(range);

            //return the list of newline-separated characters
            return window.getSelection().toString().toLowerCase().split("\n");
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

    return tokenDict;
        
    
}