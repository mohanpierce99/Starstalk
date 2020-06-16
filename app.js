const puppeteer = require('puppeteer');
const beautify = require("json-beautify");
const fs = require('fs');

let masterJSON = {}
let pageCount = 0;


async function crawl(link, headless = false) {

    const browser = await puppeteer.launch({
        args: ['--enable-features=NetworkService', '--no-sandbox'],
        ignoreHTTPSErrors: true,
        headless
    })
    var page = await browser.newPage();
    page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36');
    await page.setViewport({
        width: 1366,
        height: 768
    });
    await page.goto(link, { waitUntil: 'domcontentloaded' });
    recursiveStar(page);
}

async function recursiveStar(page) {
    const elements = await page.evaluate(() => Array.from(document.querySelectorAll('div.follower-list-align-top.d-inline-block.ml-3'), element => element.innerText));
    elements.forEach(d => {
        let follower = d.split("\n ")
        let meta = follower[1].replace(/\n+follow/gi, '').split(",").join('');
        let nameF = follower[0].replace(/\r?\n|\r/g, '');

        const matchedKeys = Object.keys(masterJSON).filter(metaPlace => ~metaPlace.indexOf(meta.split(" ")[0]));

        if (matchedKeys.length) {
            matchedKeys.forEach(d => {
                masterJSON[d].push(nameF);
            });
        } else {
            masterJSON[meta] = [nameF]
        }
    });

    try {
        await Promise.all([
            page.click("#repos > div.paginate-container > div > a:nth-child(2)"),
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 6000 })
        ]);
    } catch (e) {
        masterJSON["pagecount"] = pageCount;
        fs.writeFileSync("./data.json", beautify(masterJSON, null, 2, 100))
        process.exit(0);
    }
    console.log(masterJSON);
    console.log("\n")
    recursiveStar(page);
}

crawl("https://github.com/KuroLabs/stegcloak/stargazers");
