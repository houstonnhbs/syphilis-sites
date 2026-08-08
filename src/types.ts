export interface SurveySite {
  id: string;
  name: string;
  address: string;
  type: 'Department' | 'Community';
  coordinates: [number, number];
  description: string;
  phone: string;
  hours: string;
}

export type ClinicTypeFilter = 'ALL' | 'Department' | 'Community';

