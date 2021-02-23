const puppeteer = require('puppeteer');
const url = "https://cmo.ostfalia.de/qisserver/pages/cs/sys/portal/hisinoneStartPage.faces?chco=y";
function run () {
    return new Promise(async (resolve, reject) => {
        try {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            console.log("Start scraping...")
            await page.goto(url);
            await page.waitForSelector('input[name=asdf]');
            await page.$eval('input[id="asdf"]', el => {
                el.value = 'ID';
            });
            await page.$eval('input[id="fdsa"]', el => {
                el.value = 'PASSWORD';
            });
            await page.click('button[name="submit"]');
            await page.waitForSelector('#repeat\\:1\\:notSelectedLink1');
            await page.click('#repeat\\:1\\:notSelectedLink1');

            await page.goto("https://cmo.ostfalia.de/qisserver/pages/sul/examAssessment/personExamsReadonly.xhtml?_flowId=examsOverviewForPerson-flow&_flowExecutionKey=e1s1")

            await page.waitForSelector('#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:t2g_0-0-0-0')
            await page.click('#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:t2g_0-0-0-0');

            await page.waitForSelector('.treeTableCellLevel4')
            let elements = await page.evaluate(() => {
                return document.querySelectorAll('.treeTableCellLevel4');
            })
            const data = [];
            let i = 0;
            for(let element in elements){
                let name = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:unDeftxt`, (element) => {
                    return element.innerHTML
                })
                let credits = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:bonus`, (element) => {
                    return element.innerHTML
                })
                let grade = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:grade`, (element) => {
                    return element.innerHTML
                })
                let attempts = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:attempt`, (element) => {
                    return element.innerHTML
                })
                //console.log(`Name: ${name}; Credits: ${credits}; Grade: ${grade}; Attempts: ${attempts}`)
                const module = {name:name, credits: parseInt(credits), grade: parseFloat(grade), attempts: parseInt(attempts)};
                data.push(module)
                i++;
            }
            browser.close();
            console.log("Finished scraping.")

            return resolve(data);
        } catch (e) {
            return reject(e);
        }
    })
}
run().then((result) => {
    let allCredits = 0;
    let creditGrade = 0;
    for (let modul of result){
        console.log(modul)
        allCredits += modul.credits;
        creditGrade += modul.grade * modul.credits;
    }
    let average = creditGrade / allCredits;
    console.log("The Average Grade is: " + average)
}).catch(console.error);
