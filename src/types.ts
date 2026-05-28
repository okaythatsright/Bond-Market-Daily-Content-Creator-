export interface BondDataPoint {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  details?: string;
}

export interface BondMarketSection {
  id: string;
  title: string;
  description: string;
  data: BondDataPoint[];
}

export interface GeneratedPost {
  sectionId: string;
  sectionTitle: string;
  charCount: number;
  postText: string;
}

export interface LoggedStatus {
  sectionId: string;
  sectionTitle: string;
  status: 'pending' | 'success' | 'failed';
  entryNumber?: number;
  details?: string;
}

export interface BlueSkyStatus {
  sectionId: string;
  status: 'pending' | 'success' | 'failed' | 'skipped';
  uri?: string;
  cid?: string;
  error?: string;
}
