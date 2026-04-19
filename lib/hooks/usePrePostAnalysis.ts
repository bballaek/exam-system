import useSWR from "swr";

export interface Student {
  studentName: string;
  studentId: string;
  classroom: string | null;
  preScore: number;
  postScore: number | null;
  change: number | null;
  status: "improved" | "declined" | "same" | "incomplete";
}

export interface Analysis {
  totalStudents: number;
  completedBoth: number;
  preAvg: number;
  postAvg: number;
  avgChange: number;
  improvedCount: number;
  declinedCount: number;
  sameCount: number;
  students: Student[];
}

export interface Pair {
  pairId: string;
  pretest: { id: string; title: string; submissionCount: number };
  posttest: { id: string; title: string; submissionCount: number };
  analysis: Analysis;
}

interface PrePostResponse {
  pairs: Pair[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePrePostAnalysis() {
  const { data, error, isLoading, mutate } = useSWR<PrePostResponse>(
    "/api/prepost",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Cache for 10 seconds
    }
  );

  return {
    pairs: data?.pairs || [],
    isLoading,
    isError: error,
    mutate,
  };
}
