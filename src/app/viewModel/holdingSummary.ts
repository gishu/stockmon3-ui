export interface HoldingSummary {
  stock: String;
  quantity: number;
  averagePrice: number;
  cmp: number;
  tco: number;
  unrealizedGain: number;
  gainPercent: number;
}

export interface Holding {
  date: string;
  stock: string;
  quantity: number;
  averagePrice: number;
  cmp: number;
  unrealizedGain: number;
  notes: string;
  type: string;
  age: number;
  gainPercent: number;
  cagr: number;
}
