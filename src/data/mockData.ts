// DigitalKisan Admin Dashboard Mock Data

export interface Farmer {
  id: string;
  name: string;
  location: string;
  joinDate: string;
  status: 'Pending' | 'Verified' | 'Suspended';
  documentUrl: string;
  rating: number;
}

export interface Transaction {
  id: string;
  farmerName: string;
  buyerName: string;
  amount: number;
  product: string;
  date: string;
  status: 'Escrow' | 'Released' | 'Disputed' | 'Refunded';
}

export interface Dispute {
  id: string;
  transactionId: string;
  raisedBy: string;
  reason: string;
  date: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Resolved';
}

export const MOCK_STATS = [
  { label: 'Total GMV', value: '₨ 4.2M', change: '+12.5%', color: 'emerald' },
  { label: 'Active Farmers', value: '1,280', change: '+3.2%', color: 'blue' },
  { label: 'Pending Verifications', value: '24', change: '-5', color: 'amber' },
  { label: 'Open Disputes', value: '7', change: '+2', color: 'rose' },
];

export const MOCK_FARMERS: Farmer[] = [
  { id: 'F1', name: 'Zafar Iqbal', location: 'Faisalabad', joinDate: '2024-10-01', status: 'Verified', documentUrl: '#', rating: 4.8 },
  { id: 'F2', name: 'Ali Raza', location: 'Okara', joinDate: '2024-10-15', status: 'Pending', documentUrl: '#', rating: 0 },
  { id: 'F3', name: 'Malik Enterprises', location: 'Multan', joinDate: '2024-09-20', status: 'Verified', documentUrl: '#', rating: 4.5 },
  { id: 'F4', name: 'Sajid Mehmood', location: 'Sargodha', joinDate: '2024-10-18', status: 'Pending', documentUrl: '#', rating: 0 },
  { id: 'F5', name: 'Bibi Zainab', location: 'Swat', joinDate: '2024-08-12', status: 'Suspended', documentUrl: '#', rating: 3.2 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TX001', farmerName: 'Zafar Iqbal', buyerName: 'Kashif Ali', amount: 45000, product: 'Basmati Rice', date: '2024-10-20', status: 'Escrow' },
  { id: 'TX002', farmerName: 'Malik Enterprises', buyerName: 'Zainab Qazi', amount: 120000, product: 'Wheat', date: '2024-10-19', status: 'Released' },
  { id: 'TX003', farmerName: 'Ali Raza', buyerName: 'Umer Khan', amount: 8000, product: 'Tomatoes', date: '2024-10-20', status: 'Disputed' },
  { id: 'TX004', farmerName: 'Zafar Iqbal', buyerName: 'Ahmed Jan', amount: 35000, product: 'Maize', date: '2024-10-18', status: 'Released' },
];

export const MOCK_DISPUTES: Dispute[] = [
  { id: 'DSP01', transactionId: 'TX003', raisedBy: 'Umer Khan', reason: 'Quality not as specified in Grade A', date: '2024-10-20', severity: 'High', status: 'Open' },
  { id: 'DSP02', transactionId: 'TX012', raisedBy: 'Sana Malik', reason: 'Weight discrepancy', date: '2024-10-15', severity: 'Medium', status: 'In Progress' },
];

export const CHART_DATA = [
  { name: 'Jan', gmv: 4000, volume: 2400 },
  { name: 'Feb', gmv: 3000, volume: 1398 },
  { name: 'Mar', gmv: 2000, volume: 9800 },
  { name: 'Apr', gmv: 2780, volume: 3908 },
  { name: 'May', gmv: 1890, volume: 4800 },
  { name: 'Jun', gmv: 2390, volume: 3800 },
  { name: 'Jul', gmv: 3490, volume: 4300 },
];
