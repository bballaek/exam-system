import useSWR from 'swr';

export interface ExamSet {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isActive: boolean;
  createdAt: string;
  timeLimitMinutes?: number | null;
  shuffleQuestions?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  questionCount: number;
  submissionCount: number;
  _count?: {
    questions: number;
    submissions: number;
  };
}

interface ExamSetsResponse {
  success: boolean;
  examSets: ExamSet[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useExamSets() {
  const { data, error, isLoading, mutate } = useSWR<ExamSetsResponse>(
    '/api/exam-sets',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );

  return {
    examSets: data?.examSets || [],
    isLoading,
    isError: error,
    mutate,
  };
}
