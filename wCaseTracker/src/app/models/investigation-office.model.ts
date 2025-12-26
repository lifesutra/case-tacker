export interface InvestigationOffice {
  id?: number;
  officeName: string;
  officerName: string;
  designation: string;
  timePeriod: TimePeriod;
  caseNumber: string;
  caseDate: Date;
  serialNumber?: number;
  totalCases?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum TimePeriod {
  OVER_ONE_YEAR = '1 वर्षा वरील',
  SIX_TO_TWELVE_MONTHS = '6 ते 12 महिने',
  THREE_TO_SIX_MONTHS = '3 ते 6 महिने',
  ONE_TO_THREE_MONTHS = '1 ते 3 महिने',
  ONE_TO_FOUR_MONTHS = '1 ते 4 महिने'
}

