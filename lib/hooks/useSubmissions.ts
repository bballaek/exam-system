import useSWR from 'swr';

export interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  examTitle: string;
  examSetId: string;
  submittedAt: string;
}

interface SubmissionsResponse {
  success: boolean;
  submissions: Submission[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useSubmissions(examSetId?: string) {
  const url = examSetId
    ? `/api/results?examSetId=${examSetId}`
    : '/api/results';

  const { data, error, isLoading, mutate } = useSWR<SubmissionsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    submissions: data?.submissions || [],
    isLoading,
    isError: error,
    mutate,
  };
}
