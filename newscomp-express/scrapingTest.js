const url = "https://www.cnn.com/2021/10/26/tech/facebook-covid-vaccine-misinformation/index.html";

const puppeteer = require('puppeteer');
const cluster = require('puppeteer-cluster');



function markTime(){
    return (new Date()).getTime()/1000;
}

let time_start = markTime();
let time_loadBrowser = 0;
let time_gotopage = 0;

async function getText(url, textParser){
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = (await browser.pages())[0];

    time_loadBrowser = markTime();
    console.log("puppeteer page launched in %d seconds", time_loadBrowser-time_start);

    await page.goto(url, {waitUntil:"domcontentloaded"});

    time_gotopage = markTime();
    console.log("page went to in %d seconds", time_gotopage-time_loadBrowser);

    const extractedText = await page.$eval('*', (el) => {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNode(el);
        selection.removeAllRanges();
        selection.addRange(range);
        const out = window.getSelection().toString().split("\n");
        return out;
    });

    await browser.close();
}


let elementLengthsExtractor = (text) => text.map((paragraph) => paragraph.split(/\W+/).length);

getText(url);

