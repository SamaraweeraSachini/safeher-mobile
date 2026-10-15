export interface TrustedContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface TrustedContactInput {
  name: string;
  relationship: string;
  phone: string;
}