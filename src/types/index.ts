export interface Demand {
  id: string;
  buyerName: string;
  industry: string;
  dataScope: string;
  updateFrequency: string;
  budgetMin: number;
  budgetMax: number;
  complianceReqs: string;
  status: 'pending' | 'matching' | 'completed';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  supplier: string;
  tags: string[];
  description: string;
  dataScope: string;
  updateFrequency: string;
  price: number;
  deliveryCycle: string;
  restrictions: string;
  complianceCerts: string[];
}

export interface MatchResult {
  id: string;
  demandId: string;
  productId: string;
  scoreDataScope: number;
  scoreFrequency: number;
  scorePrice: number;
  scoreCompliance: number;
  totalScore: number;
  markedPrice: string;
  markedDelivery: string;
  markedRestrictions: string;
  status: 'candidate' | 'shortlisted' | 'recommended' | 'rejected';
}

export interface Communication {
  id: string;
  demandId: string;
  matchResultId: string;
  date: string;
  participants: string;
  content: string;
  keyConclusions: string;
  nextFollowUpDate: string;
  todoItems: string[];
}

export type DemandStatus = Demand['status'];
export type MatchStatus = MatchResult['status'];
