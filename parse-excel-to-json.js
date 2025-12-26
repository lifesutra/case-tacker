const fs = require('fs');
const { execSync } = require('child_process');

console.log('Converting Excel to CSV...');
const csvOutput = execSync('npx --yes xlsx-cli "Chargesheet in time.xlsx"', { encoding: 'utf8' });

const lines = csvOutput.split('\n').filter(line => line.trim());
const offices = [];
let currentOfficeName = '';
let currentOfficerName = '';
let currentDesignation = '';
let currentTimePeriod = '';

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const clean = dateStr.trim().replace(/\./g, '');
  const match = clean.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    let year = parseInt(match[3]);
    if (year < 100) year = year < 50 ? 2000 + year : 1900 + year;
    return new Date(year, month, day).toISOString();
  }
  return null;
}

function getTimePeriod(str) {
  if (!str) return '';
  if (str.includes('1 वर्षा वरील')) return '1 वर्षा वरील';
  if (str.includes('6 ते 12 महिने')) return '6 ते 12 महिने';
  if (str.includes('3 ते 6 महिने')) return '3 ते 6 महिने';
  if (str.includes('1 ते 3 महिने')) return '1 ते 3 महिने';
  if (str.includes('1 ते 4 महिने')) return '1 ते 4 महिने';
  return '';
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(',').map(p => p.trim());
  
  if (line.includes('पोलीस स्टेशन प्रलंबित गुन्हे')) {
    const match = line.match(/(.+?)\s+पोलीस स्टेशन/);
    if (match) currentOfficeName = match[1].trim();
    continue;
  }
  
  if (parts[1] && parts[1].includes('अधिकारी') || parts[1].includes('कालावधी')) {
    continue;
  }
  
  if (parts[1] && parts[1] !== '' && !parts[1].match(/^\d+$/) && !parts[1].includes('एकुण')) {
    const officerInfo = parts[1];
    
    const designations = ['P.I.', 'PSI', 'API', 'पोउपनि', 'मपोउपनि', 'श्रेणी.पोउपनि', 'सपोनि', 'ASI', 'स.फौ', 'सफौ', 'पोह', 'मपोह', 'पोना', 'पोहे', 'मपोना', 'इतर'];
    let foundDesig = '';
    
    for (const desig of designations) {
      if (officerInfo.startsWith(desig)) {
        foundDesig = desig;
        break;
      }
    }
    
    if (foundDesig) {
      currentDesignation = foundDesig;
      currentOfficerName = officerInfo.replace(foundDesig, '').trim();
    } else {
      const numMatch = officerInfo.match(/^(पोह|मपोह|सफौ|पोना|मपोना|पोहे|मपोहे|स\.फौ)[\s\/\.]+(\d+)/);
      if (numMatch) {
        currentDesignation = numMatch[1] + ' ' + numMatch[2];
        currentOfficerName = officerInfo.replace(numMatch[0], '').trim();
      } else {
        currentOfficerName = officerInfo;
        currentDesignation = '';
      }
    }
    continue;
  }
  
  const timePeriodStr = parts[2] || '';
  const timePeriod = getTimePeriod(timePeriodStr);
  if (timePeriod) {
    currentTimePeriod = timePeriod;
    continue;
  }
  
  if (parts[2] && parts[2].includes('एकुण')) {
    currentTimePeriod = '';
    continue;
  }
  
  const serialNum = parts[3] ? parseInt(parts[3]) : null;
  const caseNum = parts[4] || '';
  const caseDateStr = parts[5] || '';
  
  if (caseNum && caseNum !== '' && caseDateStr && caseDateStr !== '' && currentTimePeriod && currentOfficerName && currentOfficeName) {
    const caseDate = parseDate(caseDateStr);
    if (caseDate) {
      offices.push({
        officeName: currentOfficeName,
        officerName: currentOfficerName,
        designation: currentDesignation,
        timePeriod: currentTimePeriod,
        caseNumber: caseNum,
        caseDate: caseDate,
        serialNumber: serialNum
      });
    }
  }
}

console.log(`Parsed ${offices.length} offices`);
fs.writeFileSync('investigation-offices-import.json', JSON.stringify(offices, null, 2));
console.log('Created investigation-offices-import.json');

