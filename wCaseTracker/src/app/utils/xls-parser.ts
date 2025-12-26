import * as XLSX from 'xlsx';
import { CaseType } from '../models/case.model';

export interface ParsedCaseData {
  caseNumber: string;
  caseDate: Date;
  caseType: CaseType;
  investigationOfficeName?: string;
  investigationOfficePhone?: string;
  title?: string;
  description?: string;
  complainant?: string;
  accused?: string;
  location?: string;
}

export function parseXLSFile(file: File): Promise<ParsedCaseData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const cases: ParsedCaseData[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

          const parsedCases = parseHierarchicalStructure(jsonData);
          cases.push(...parsedCases);
        });

        resolve(cases);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsArrayBuffer(file);
  });
}

function parseHierarchicalStructure(data: any[][]): ParsedCaseData[] {
  const cases: ParsedCaseData[] = [];
  let currentOfficeName = '';
  let currentOfficerName = '';
  let currentDesignation = '';
  let currentTimePeriod: string | null = null;

  if (data.length === 0) return cases;

  const firstRow = data[0];
  const firstCell = getCellValue(firstRow, 0);
  const isStandardFormat = firstCell && (
    firstCell.toString().includes('पोलीस स्टेशन') || 
    firstCell.toString().includes('Police Station')
  );

  if (isStandardFormat) {
    return parseStandardFormat(data);
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const col0 = getCellValue(row, 0);
    const col1 = getCellValue(row, 1);
    const col2 = getCellValue(row, 2);
    const col3 = getCellValue(row, 3);
    const col4 = getCellValue(row, 4);
    const col5 = getCellValue(row, 5);

    if (!col1) continue;

    const col1Str = col1.toString().trim();
    const col2Str = col2 ? col2.toString().trim() : '';

    if (col1Str.includes('पोलीस स्टेशन') || col1Str.includes('Police Station')) {
      const officeMatch = col1Str.match(/(.+?)\s+पोलीस स्टेशन/);
      if (officeMatch) {
        currentOfficeName = officeMatch[1].trim();
      } else {
        currentOfficeName = col1Str.replace(/पोलीस स्टेशन/gi, '').trim();
      }
      continue;
    }

    if (col1Str.includes('अधिकारी') || col1Str.includes('अमंलदार') || col1Str.includes('Officer')) {
      continue;
    }

    if (col1Str && !col1Str.match(/^\d+$/) && !isTimePeriod(col1Str) && !col1Str.includes('एकुण') && !col1Str.includes('Total')) {
      const officerInfo = col1Str;
      const designationMatch = officerInfo.match(/^(P\.I\.|PSI|API|पोउपनि|मपोउपनि|श्रेणी\.पोउपनि|सपोनि|ASI|स\.फौ|सफौ|पोह|मपोह|पोना|पोहे|मपोना|इतर|Sub-Inspector|Inspector)/);
      
      if (designationMatch) {
        currentDesignation = designationMatch[1];
        currentOfficerName = officerInfo.replace(designationMatch[0], '').trim();
      } else {
        currentOfficerName = officerInfo;
        currentDesignation = '';
      }
      currentTimePeriod = null;
      continue;
    }

    if (isTimePeriod(col1Str) || isTimePeriod(col2Str)) {
      const timePeriodStr = isTimePeriod(col1Str) ? col1Str : col2Str;
      currentTimePeriod = timePeriodStr;
      continue;
    }

    if (col1Str.includes('एकुण') || col1Str.includes('Total') || col2Str.includes('एकुण') || col2Str.includes('Total')) {
      currentTimePeriod = null;
      continue;
    }

    const caseNumber = getCellValue(row, 4);
    const caseDateStr = getCellValue(row, 5);

    if (caseNumber && caseDateStr) {
      const caseNumberStr = caseNumber.toString().trim();
      const caseDate = parseDate(caseDateStr.toString().trim());

      if (caseNumberStr && caseDate && currentTimePeriod && currentOfficerName && currentOfficeName) {
        const caseType = determineCaseTypeFromTimePeriod(currentTimePeriod);
        
        cases.push({
          caseNumber: caseNumberStr,
          caseDate: caseDate,
          caseType: caseType,
          investigationOfficeName: `${currentOfficeName} - ${currentDesignation} ${currentOfficerName}`.trim(),
          investigationOfficePhone: undefined,
          title: `केस ${caseNumberStr}`,
          description: `तपासणी कार्यालय: ${currentOfficeName}, अधिकारी: ${currentDesignation} ${currentOfficerName}, कालावधी: ${currentTimePeriod}`,
          location: currentOfficeName
        });
      }
    }
  }

  return cases;
}

function parseStandardFormat(data: any[][]): ParsedCaseData[] {
  const cases: ParsedCaseData[] = [];
  let currentOfficeName = '';
  let currentOfficerName = '';
  let currentDesignation = '';
  let currentTimePeriod: string | null = null;

  if (data.length < 3) return cases;

  const officeNameRow = data[0];
  const officeNameCell = getCellValue(officeNameRow, 0);
  if (officeNameCell) {
    const officeNameStr = officeNameCell.toString().trim();
    const officeMatch = officeNameStr.match(/(.+?)\s+पोलीस स्टेशन/);
    if (officeMatch) {
      currentOfficeName = officeMatch[1].trim();
    } else {
      currentOfficeName = officeNameStr.replace(/पोलीस स्टेशन/gi, '').replace(/प्रलंबित गुन्हे/gi, '').trim();
    }
  }

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const col0 = getCellValue(row, 0);
    const col1 = getCellValue(row, 1);
    const col2 = getCellValue(row, 2);
    const col3 = getCellValue(row, 3);
    const col4 = getCellValue(row, 4);
    const col5 = getCellValue(row, 5);

    const col1Str = col1 ? col1.toString().trim() : '';
    const col2Str = col2 ? col2.toString().trim() : '';
    const col4Str = col4 ? col4.toString().trim() : '';
    const col5Str = col5 ? col5.toString().trim() : '';

    if (col1Str.includes('अधिकारी') || col1Str.includes('अमंलदार') || col1Str.includes('Officer') || 
        col1Str.includes('कालावधी') || col1Str.includes('गुरनं') || col1Str.includes('गुन्हा')) {
      continue;
    }

    if (col1Str && !col1Str.match(/^\d+$/) && !isTimePeriod(col1Str) && 
        !col1Str.includes('एकुण') && !col1Str.includes('Total') && col1Str.length > 2) {
      const officerInfo = col1Str;
      const designationMatch = officerInfo.match(/^(P\.I\.|PSI|API|पोउपनि|मपोउपनि|श्रेणी\.पोउपनि|सपोनि|ASI|स\.फौ|सफौ|पोह|मपोह|पोना|पोहे|मपोना|इतर|Sub-Inspector|Inspector)/);
      
      if (designationMatch) {
        currentDesignation = designationMatch[1];
        currentOfficerName = officerInfo.replace(designationMatch[0], '').trim();
      } else {
        currentOfficerName = officerInfo;
        currentDesignation = '';
      }
    }

    if (isTimePeriod(col2Str)) {
      currentTimePeriod = col2Str;
    }

    if (col2Str.includes('एकुण') || col2Str.includes('Total')) {
      currentTimePeriod = null;
      if (!col4Str || !col5Str) {
        continue;
      }
    }

    if (col4Str && col5Str) {
      const caseNumberStr = col4Str;
      const caseDate = parseDate(col5Str);

      if (caseNumberStr && caseDate) {
        if (!currentTimePeriod) {
          currentTimePeriod = determineTimePeriodFromDate(caseDate);
        }

        const caseType = determineCaseTypeFromTimePeriod(currentTimePeriod || '');
        
        cases.push({
          caseNumber: caseNumberStr,
          caseDate: caseDate,
          caseType: caseType,
          investigationOfficeName: currentOfficeName && currentOfficerName 
            ? `${currentOfficeName} - ${currentDesignation} ${currentOfficerName}`.trim()
            : currentOfficeName || undefined,
          investigationOfficePhone: undefined,
          title: `केस ${caseNumberStr}`,
          description: currentOfficeName && currentOfficerName && currentTimePeriod
            ? `तपासणी कार्यालय: ${currentOfficeName}, अधिकारी: ${currentDesignation} ${currentOfficerName}, कालावधी: ${currentTimePeriod}`
            : `तपासणी कार्यालय: ${currentOfficeName || 'अज्ञात'}`,
          location: currentOfficeName || ''
        });
      }
    }
  }

  return cases;
}

function determineTimePeriodFromDate(caseDate: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - caseDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMonths >= 12) {
    return '1 वर्षा वरील';
  } else if (diffMonths >= 6) {
    return '6 ते 12 महिने';
  } else if (diffMonths >= 3) {
    return '3 ते 6 महिने';
  } else if (diffMonths >= 1) {
    return '1 ते 3 महिने';
  } else {
    return '1 ते 3 महिने';
  }
}

function getCellValue(row: any[], index: number): any {
  return row && row.length > index ? row[index] : '';
}

function isTimePeriod(str: string): boolean {
  if (!str) return false;
  const timePeriods = [
    '1 वर्षा वरील',
    '6 ते 12 महिने',
    '3 ते 6 महिने',
    '1 ते 3 महिने',
    '1 ते 4 महिने',
    'Above 1 year',
    '6 to 12 months',
    '3 to 6 months',
    '1 to 3 months',
    '1 to 4 months'
  ];
  return timePeriods.some(tp => str.includes(tp));
}

function determineCaseTypeFromTimePeriod(timePeriod: string): CaseType {
  if (timePeriod.includes('1 वर्षा वरील') || timePeriod.includes('Above 1 year')) {
    return CaseType.DAYS_90;
  }
  if (timePeriod.includes('6 ते 12 महिने') || timePeriod.includes('6 to 12 months')) {
    return CaseType.DAYS_90;
  }
  if (timePeriod.includes('3 ते 6 महिने') || timePeriod.includes('3 to 6 months')) {
    return CaseType.DAYS_60;
  }
  if (timePeriod.includes('1 ते 3 महिने') || timePeriod.includes('1 to 3 months')) {
    return CaseType.DAYS_45;
  }
  if (timePeriod.includes('1 ते 4 महिने') || timePeriod.includes('1 to 4 months')) {
    return CaseType.DAYS_45;
  }
  return CaseType.DAYS_60;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  const cleanDate = dateStr.toString().trim().replace(/\./g, '');

  const formats = [
    /(\d{2})-(\d{2})-(\d{4})/,
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{2})-(\d{2})-(\d{2})/,
    /(\d{4})-(\d{2})-(\d{2})/,
  ];

  for (const format of formats) {
    const match = cleanDate.match(format);
    if (match) {
      const day = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const year = parseInt(match[3]);

      let fullYear = year;
      if (year < 100) {
        fullYear = year < 50 ? 2000 + year : 1900 + year;
      }

      const date = new Date(fullYear, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const excelDate = parseExcelDate(cleanDate);
  if (excelDate) return excelDate;

  return null;
}

function parseExcelDate(value: string | number): Date | null {
  if (typeof value === 'number') {
    const excelEpoch = new Date(1899, 11, 30);
    const days = Math.floor(value);
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return date;
  }
  return null;
}
