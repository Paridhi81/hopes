// utils/data.ts
import { supabase } from '@/lib/supabaseClient';

export interface Project {
  id: string;
  name: string;
  description: string;
  district: string;
  city: string;
  createdAt: string;
  policyMakerThresholds: {
    HMPI: number;
  };
}

export interface Sample {
  id: string;
  projectId: string;
  sampleId: string;
  metal: string;
  Si: number; // mg/L
  Ii: number;
  Mi: number;
  latitude: number;
  longitude: number;
  district: string;
  city: string;
  date: string;
}

export interface Alert {
  id: string;
  projectId: string;
  sampleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  acknowledged: boolean;
  createdAt: string;
}

export interface Policy {
  id: string;
  name: string;
  metal: string;
  threshold: number;
  createdBy: string;
  createdAt: string;
}

// Data fetching and mutation functions
export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*');
  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
  return data as Project[];
}

export async function fetchSamples(): Promise<Sample[]> {
  const { data, error } = await supabase.from('samples').select('*');
  if (error) {
    console.error('Error fetching samples:', error);
    return [];
  }
  return data as Sample[];
}

export async function fetchAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase.from('alerts').select('*');
  if (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
  return data as Alert[];
}

export async function fetchPolicies(): Promise<Policy[]> {
  const { data, error } = await supabase.from('policies').select('*');
  if (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
  return data as Policy[];
}

export async function createProject(projectData: Partial<Project>) {
  const { data, error } = await supabase.from('projects').insert([projectData]).select();
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  return data;
}

export async function createSample(sampleData: Partial<Sample>) {
  const { data, error } = await supabase.from('samples').insert([sampleData]).select();
  if (error) {
    console.error('Error creating sample:', error);
    throw error;
  }
  return data;
}

export async function acknowledgeAlert(alertId: string) {
  const { data, error } = await supabase.from('alerts').update({ acknowledged: true }).eq('id', alertId).select();
  if (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
  return data;
}

export async function createPolicy(policyData: Partial<Policy>) {
  const { data, error } = await supabase.from('policies').insert([policyData]).select();
  if (error) {
    console.error('Error creating policy:', error);
    throw error;
  }
  return data;
}

export async function updateProjectThreshold(projectId: string, thresholds: object) {
  const { data, error } = await supabase.from('projects').update({ "policyMakerThresholds": thresholds }).eq('id', projectId).select();
  if (error) {
    console.error('Error updating project threshold:', error);
    throw error;
  }
  return data;
}


// HMPI Calculation Function
export function calculateHMPI(sample: Sample): number {
  const { Si, Ii, Mi } = sample;
  const hmpi = (Si / Ii) * Mi * 100;
  return Math.round(hmpi * 100) / 100; // Round to 2 decimal places
}

// Risk Level Assessment
export function getRiskLevel(hmpi: number): { level: string; color: string } {
  if (hmpi >= 100) return { level: "Very High Risk", color: "#DC2626" };
  if (hmpi >= 50) return { level: "High Risk", color: "#EA580C" };
  if (hmpi >= 25) return { level: "Moderate Risk", color: "#D97706" };
  if (hmpi >= 10) return { level: "Low Risk", color: "#65A30D" };
  return { level: "Safe", color: "#059669" };
}

// Sample Excel Template
export const excelTemplate = {
  headers: [
    "SampleID",
    "ProjectID",
    "District",
    "City",
    "Latitude",
    "Longitude",
    "Metal",
    "Si",
    "Ii",
    "Mi",
    "Date"
  ],
  sampleData: [
    ["GNG-008", "p1", "Varanasi", "Varanasi", "25.3176", "82.9739", "Lead", "0.09", "0.3", "0.7", "2025-01-20"],
    ["YMN-006", "p2", "New Delhi", "Delhi", "28.7041", "77.1025", "Arsenic", "0.05", "0.2", "0.5", "2025-02-12"],
  ]
};