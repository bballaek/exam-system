/**
 * Statistics Utility Functions
 * For research and analysis purposes
 */

// Calculate mean (average)
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

// Calculate median (middle value)
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Calculate mode (most frequent value)
export function mode(values: number[]): number[] {
  if (values.length === 0) return [];
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    maxFreq = Math.max(maxFreq, frequency[val]);
  });
  
  return Object.entries(frequency)
    .filter(([, freq]) => freq === maxFreq)
    .map(([val]) => Number(val));
}

// Calculate variance
export function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
}

// Calculate standard deviation
export function standardDeviation(values: number[]): number {
  return Math.sqrt(variance(values));
}

// Calculate skewness (measure of asymmetry)
export function skewness(values: number[]): number {
  if (values.length < 3) return 0;
  const n = values.length;
  const avg = mean(values);
  const sd = standardDeviation(values);
  if (sd === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + Math.pow((val - avg) / sd, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

// Calculate kurtosis (measure of tailedness)
export function kurtosis(values: number[]): number {
  if (values.length < 4) return 0;
  const n = values.length;
  const avg = mean(values);
  const sd = standardDeviation(values);
  if (sd === 0) return 0;
  
  const sum = values.reduce((acc, val) => acc + Math.pow((val - avg) / sd, 4), 0);
  const excess = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
  const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  return excess - correction;
}

// Calculate range
export function range(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

// Calculate percentile
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

// Calculate quartiles
export function quartiles(values: number[]): { q1: number; q2: number; q3: number } {
  return {
    q1: percentile(values, 25),
    q2: percentile(values, 50),
    q3: percentile(values, 75),
  };
}

// Calculate all research statistics
export function calculateAllStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const q = quartiles(values);
  
  return {
    n: values.length,
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    range: range(values),
    variance: variance(values),
    standardDeviation: standardDeviation(values),
    skewness: skewness(values),
    kurtosis: kurtosis(values),
    q1: q.q1,
    q2: q.q2,
    q3: q.q3,
  };
}

// Group students by percentile (Top 27%, Middle 46%, Bottom 27%)
export interface StudentGroup {
  name: string;
  students: Array<{ id: string; name: string; score: number; percentage: number }>;
  color: string;
  bgColor: string;
  textColor: string;
}

export function groupStudentsByPercentile(
  students: Array<{ id: string; studentName: string; percentage: number; score: number }>
): StudentGroup[] {
  const sorted = [...students].sort((a, b) => b.percentage - a.percentage);
  const total = sorted.length;
  
  const topCutoff = Math.ceil(total * 0.27);
  const bottomCutoff = Math.ceil(total * 0.27);
  
  const topStudents = sorted.slice(0, topCutoff);
  const middleStudents = sorted.slice(topCutoff, total - bottomCutoff);
  const bottomStudents = sorted.slice(total - bottomCutoff);
  
  return [
    {
      name: "กลุ่มเก่ง (Top 27%)",
      students: topStudents.map(s => ({ id: s.id, name: s.studentName, score: s.score, percentage: s.percentage })),
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      name: "กลุ่มกลาง (Middle 46%)",
      students: middleStudents.map(s => ({ id: s.id, name: s.studentName, score: s.score, percentage: s.percentage })),
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    {
      name: "กลุ่มอ่อน (Bottom 27%)",
      students: bottomStudents.map(s => ({ id: s.id, name: s.studentName, score: s.score, percentage: s.percentage })),
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
  ];
}
