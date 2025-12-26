const fs = require('fs');
const { parseExcelDataToOffices } = require('./wCaseTracker/src/app/utils/excel-import.ts');

const csvData = fs.readFileSync('Chargesheet in time.xlsx', 'utf8');
const offices = parseExcelDataToOffices(csvData);

console.log(JSON.stringify(offices, null, 2));
console.log(`\nTotal offices to import: ${offices.length}`);

