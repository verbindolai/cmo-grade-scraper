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

            await page.waitForSelector('#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:expandAll2')
            await page.click('#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:expandAll2')

            await page.waitForSelector('.treeTableCellLevel4')
            let elements = await page.evaluate(() => {
                return document.querySelectorAll('.treeTableCellLevel4');
            })
            const data = [];
            let i = 0;
            for(let element in elements){
                let counter = 0;
                while (true){
                    try{
                        await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${counter}\\:unDeftxt`, (element) => {
                        })
                        counter++;
                    }catch (e){
                        break;
                    }
                }
                for (let j = 0; j < counter; j++){
                    let name = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:unDeftxt`, (element) => {
                        return element.innerHTML
                    })
                    let credits = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:bonus`, (element) => {
                        return element.innerHTML
                    })
                    let grade = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:grade`, (element) => {
                        return element.innerHTML
                    })
                    let attempts = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:attempt`, (element) => {
                        return element.innerHTML
                    })
                    //console.log(`Name: ${name}; Credits: ${credits}; Grade: ${grade}; Attempts: ${attempts}`)
                    const module = {name:name, credits: parseInt(credits), grade: parseFloat(grade), attempts: parseInt(attempts)};
                    data.push(module)
                }
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
    let allAttempts = 0;
    for (let modul of result){
        console.log(modul)
        allCredits += modul.credits;
        creditGrade += modul.grade * modul.credits;
        allAttempts += modul.attempts;
    }
    let average = creditGrade / allCredits;
    console.log("Overall Credits: " + allCredits)
    console.log("Average Attempts: " + allAttempts / result.length)
    console.log("Average Grade: " + average)
}).catch(console.error);
