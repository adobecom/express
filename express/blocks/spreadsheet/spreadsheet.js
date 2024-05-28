import { createTag } from "../../scripts/utils.js";

export default async function decorate(el) {
    try {
        const rowDiv = el.querySelectorAll(":scope > div")[0];
        const config = JSON.parse(rowDiv.textContent.replace('"', '"'));
        const {spreadsheetSrc, paginationSettings} = config;
        const resp = await fetch(`${spreadsheetSrc}`);
      
        rowDiv.remove();

        const configJSON = (await resp.json())
        const data = configJSON.data
        console.log(configJSON)

        const tableWrapper = createTag('div', {style : JSON.stringify(config.style)})
        const header = createTag('h3')
        header.textContent = config.tableTitle
        const table = createTag('table')
        for (let i = 0; i < data.length; i+=1) {
            const row = createTag('tr')
            const nameCol = createTag('td')
            const urlCol = createTag('td')
            const urlWrapper = createTag('div', {class : 'table-cell'})
            nameCol.textContent = data[i]['Block Name']
            urlWrapper.textContent = data[i]['Block Locations']
            urlCol.append(urlWrapper)
            row.append(nameCol)
            row.append(urlCol)
            table.append(row)
        }

        tableWrapper.append(header)
        tableWrapper.append(table)
        el.append(tableWrapper)
    } catch (error) {
        console.log(error)
        console.log("invalid json config")
    }
};