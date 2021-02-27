const { writeFile } = require('fs');
const puppeteer = require('puppeteer');
const readline = require("readline");
const fs = require('fs')

const url = "https://cmo.ostfalia.de/qisserver/pages/cs/sys/portal/hisinoneStartPage.faces?chco=y";
const log = {id: "", passw: ""}
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.stdoutMuted = true;

let loginNeeded;

try{
    loginNeeded = JSON.parse(fs.readFileSync('config.json')).login
}catch (e){
    loginNeeded = true;
    const login = {login:true}
    fs.writeFileSync('config.json', JSON.stringify(login))
}
const xlsx = require("xlsx");
const grades = [];

function run () {
    return new Promise( async (resolve, reject) => {
        try {

            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            await page.exposeFunction("getLogin", function() {
                return log;
            });
            console.log("\nStart scraping...")
            await page.goto(url);
            await page.waitForSelector('input[name=asdf]');
            await page.$eval('input[id="asdf"]', async (el) => {
                let login = await getLogin()
                el.value = login.id;
            });

            await page.$eval('input[id="fdsa"]', async (el) => {
                let login = await getLogin();
                el.value = login.passw;

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

            let i = 0;
            for(let element in elements){
                let counter = 0;
                while (true){ //this is awful but works for now
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
                        return element.innerHTML;
                    })
                    let credits = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:bonus`, (element) => {
                        return parseFloat(element.innerHTML);
                    })
                    let grade = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:grade`, (element) => {
                        return parseFloat(element.innerHTML);
                    })
                    let attempts = await page.$eval(`#examsReadonly\\:overviewAsTreeReadonly\\:tree\\:ExamOverviewForPersonTreeReadonly\\:0\\:0\\:0\\:0\\:${i}\\:${j}\\:attempt`, (element) => {
                        return parseInt(element.innerHTML);
                    })

                    if (isNaN(grade)){
                        grade = 1.0;
                    }
                    if (isNaN(credits)){
                        credits = 5;
                    }
                    if (isNaN(attempts)){
                        attempts = 1;
                    }
                    //console.log(`Name: ${name}; Credits: ${credits}; Grade: ${grade}; Attempts: ${attempts}`)

                    //const nameJson = await name.json();

                    //
                    const cmoModule = {name:name, credits: credits, grade: grade, attempts: attempts};
                    grades.push(cmoModule)
                }
                i++;
            }
            await browser.close();
            console.log("Finished scraping.")
            return resolve(grades);
        } catch (e) {
            return reject(e);
        }
    })
}

let allCredits = 0;
let creditGrade = 0;
let allAttempts = 0;
let average = 0;


function start(){
    if (loginNeeded) {
        login()
            .then(()=> run())
            .then((result) => console.log(result))
            .catch((error)=>console.log(error))
            .finally(() => rl.close())

    } else {
        readCreds()
            .then(() => run())
            .then((result) => processResult(result))
            .catch((error)=>console.log(error))
            .finally(() => rl.close())
    }
}

function readCreds(){
    return new Promise(((resolve, reject) => {
        try{
            let rawdata = fs.readFileSync('creds.json');
            let creds = JSON.parse(rawdata);
            log.passw = creds.passw;
            log.id = creds.id;
            return resolve();
        } catch (e){
            const login = {login:true}
            fs.writeFileSync('config.json', JSON.stringify(login))
            console.error("Config was resettet. Please restart.")
            return reject(e);
        }
    }));
}

function login(){
    return askUsername().then(() => askPassword()).then(()=> safeCreds());
}

function askUsername(){
    return new Promise((resolve, reject) => {
        try{
            rl.query = "Username: "
            rl.question(rl.query, function (username){
                log.id = username;
                return resolve();
            })
        }catch (e) {
            return reject(e);
        }
    })
}


function askPassword(){
    return new Promise((resolve, reject) => {
        try{
            rl.query = "Password: ";
            rl.question(rl.query, function(password) {
                log.passw = password;
                return resolve();
            });
        }catch (e) {
            return reject(e);
        }

    });
}

function safeCreds(){
    return new Promise((resolve, reject) => {
        try{
            rl.query = "Safe Login to JSON-File? (y/n)\n"
            rl.question(rl.query, function (answer){
                if (answer === "yes" || answer === "y"){
                    const login = {login:false}
                    fs.writeFileSync("creds.json", JSON.stringify(log));
                    fs.writeFileSync("config.json", JSON.stringify(login))
                    console.log("saved")
                }
                return resolve();
            });
        } catch (e) {
            return reject(e);
        }
    })
}

function processResult(result){
    for (let modul of result){
        console.log(modul)
        allCredits += modul.credits;
        creditGrade += modul.grade * modul.credits;
        allAttempts += modul.attempts;
    }
    average = creditGrade / allCredits;
    console.log("Overall Credits: " + allCredits)
    console.log("Average Attempts: " + allAttempts / result.length)
    console.log("Average Grade: " + average)
    createExcelSheet(result)
}

function createExcelSheet(result){
    const moduleArr = [5, 7, 7, 4, 4, 1];
    let counter = 0;
    const newWB = xlsx.utils.book_new();
    let newWS;
    for(let i = 1;i <= 6;i++){
        let newData = grades.slice(counter, counter + moduleArr[i-1]);
        counter += moduleArr[i-1];
        newWS = xlsx.utils.json_to_sheet(newData);
        xlsx.utils.book_append_sheet(newWB, newWS, `${i}. Semester`);
    }
    const allArray = []
    const moduleAll = {OverallCredits:allCredits, AverageAttempts:allAttempts / result.length, AverageGrade:average};
    allArray.push(moduleAll);

    xlsx.utils.book_append_sheet(newWB, xlsx.utils.json_to_sheet(allArray), "Gesamt");
    xlsx.writeFile(newWB, "grades.xlsx");
    process.exit(0);
}
start();
