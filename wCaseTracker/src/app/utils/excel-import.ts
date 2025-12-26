import { InvestigationOffice, TimePeriod } from '../models/investigation-office.model';

export function parseExcelDataToOffices(csvData: string): InvestigationOffice[] {
  const offices: InvestigationOffice[] = [];
  const lines = csvData.split('\n').filter(line => line.trim());
  
  let currentOfficeName = '';
  let currentOfficerName = '';
  let currentDesignation = '';
  let currentTimePeriod: TimePeriod | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length < 5) continue;
    
    if (line.includes('पोलीस स्टेशन प्रलंबित गुन्हे')) {
      const officeMatch = line.match(/(.+?)\s+पोलीस स्टेशन/);
      if (officeMatch) {
        currentOfficeName = officeMatch[1].trim();
      }
      continue;
    }
    
    if (parts[1] && parts[1].includes('अधिकारी') || parts[1].includes('अमंलदार')) {
      continue;
    }
    
    if (parts[1] && !parts[1].includes('कालावधी') && parts[1] !== '' && !parts[1].match(/^\d+$/)) {
      const officerInfo = parts[1];
      const designationMatch = officerInfo.match(/^(P\.I\.|PSI|API|पोउपनि|मपोउपनि|श्रेणी\.पोउपनि|सपोनि|ASI|स\.फौ|सफौ|पोह|मपोह|पोना|पोहे|मपोना|इतर)/);
      
      if (designationMatch) {
        currentDesignation = designationMatch[1];
        currentOfficerName = officerInfo.replace(designationMatch[0], '').trim();
      } else {
        currentOfficerName = officerInfo;
        currentDesignation = '';
      }
      continue;
    }
    
    if (parts[2] && parts[2].includes('कालावधी')) {
      continue;
    }
    
    if (parts[2] && parts[2] !== '' && !parts[2].match(/^\d+$/) && !parts[2].includes('एकुण')) {
      const timePeriodStr = parts[2].trim();
      if (timePeriodStr.includes('1 वर्षा वरील')) {
        currentTimePeriod = TimePeriod.OVER_ONE_YEAR;
      } else if (timePeriodStr.includes('6 ते 12 महिने')) {
        currentTimePeriod = TimePeriod.SIX_TO_TWELVE_MONTHS;
      } else if (timePeriodStr.includes('3 ते 6 महिने')) {
        currentTimePeriod = TimePeriod.THREE_TO_SIX_MONTHS;
      } else if (timePeriodStr.includes('1 ते 3 महिने')) {
        currentTimePeriod = TimePeriod.ONE_TO_THREE_MONTHS;
      } else if (timePeriodStr.includes('1 ते 4 महिने')) {
        currentTimePeriod = TimePeriod.ONE_TO_FOUR_MONTHS;
      }
      continue;
    }
    
    if (parts[2] && parts[2].includes('एकुण')) {
      currentTimePeriod = null;
      continue;
    }
    
    const serialNumber = parts[3] ? parseInt(parts[3]) : undefined;
    const caseNumber = parts[4] || '';
    const caseDateStr = parts[5] || '';
    
    if (caseNumber && caseNumber !== '' && caseDateStr && caseDateStr !== '') {
      const caseDate = parseDate(caseDateStr);
      if (caseDate && currentTimePeriod && currentOfficerName && currentOfficeName) {
        offices.push({
          officeName: currentOfficeName,
          officerName: currentOfficerName,
          designation: currentDesignation,
          timePeriod: currentTimePeriod,
          caseNumber: caseNumber,
          caseDate: caseDate,
          serialNumber: serialNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  }
  
  return offices;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleanDate = dateStr.trim().replace(/\./g, '');
  
  const formats = [
    /(\d{2})-(\d{2})-(\d{4})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{2})/,
  ];
  
  for (const format of formats) {
    const match = cleanDate.match(format);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);
      
      if (year < 100) {
        const fullYear = year < 50 ? 2000 + year : 1900 + year;
        return new Date(fullYear, month, day);
      }
      return new Date(year, month, day);
    }
  }
  
  return null;
}

