import fs from "fs"
import fetch from "node-fetch"
import dotenv from "dotenv"
dotenv.config() 

const urls = [
    "https://www.adobe.com/express/sitemap.xml"
]
const apiKey = process.env.apiKey
 
async function makeRequests() {
    const baseURL = "https://admin.hlx.page/sitemap/adobecom/express/stage/"
    for (const url of urls) {
        try { 
            let parsed_url = url.split("https://www.adobe.com/")[1] 
            const response = await fetch(baseURL + parsed_url, {
                method: 'POST', 
                headers: {
                    'authorization' : `token ${apiKey}` 
                },
            });
            if (!response.ok) {
                console.log(response)
                console.error(`Error: ${url}`, response.statusText);
                continue;
            }
            const data = await response.text();
            console.log(`Success: ${url}`, data);
        } catch (error) {
            console.log(error) 
        }
    }
}

makeRequests();
