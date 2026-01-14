import prisma from '@/lib/prisma';

export interface ExamSetWithStats {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  isActive: boolean;
  createdAt: string;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  lockScreen: boolean;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  questionCount: number;
  submissionCount: number;
  questionTypeCounts: {
    CHOICE: number;
    SHORT: number;
    CODEMSA: number;
    TRUE_FALSE: number;
  };
  totalPoints: number;
}

export async function getExamSets(): Promise<ExamSetWithStats[]> {
  const examSets = await prisma.examSet.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          questions: true,
          submissions: true
        }
      },
      questions: {
        select: {
          type: true,
          points: true
        }
      }
    }
  });

  type ExamSetType = typeof examSets[number];
  return examSets.map((exam: ExamSetType) => {
    // Count questions by type
    const questionTypeCounts = {
      CHOICE: 0,
      SHORT: 0,
      CODEMSA: 0,
      TRUE_FALSE: 0
    };
    
    // Calculate total points
    let totalPoints = 0;
    
    exam.questions.forEach((q) => {
      const type = q.type as keyof typeof questionTypeCounts;
      if (type in questionTypeCounts) {
        questionTypeCounts[type]++;
      }
      totalPoints += (q as { points?: number }).points || 1;
    });

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      isActive: exam.isActive,
      createdAt: exam.createdAt.toISOString(),
      timeLimitMinutes: exam.timeLimitMinutes,
      shuffleQuestions: (exam as ExamSetType & { shuffleQuestions?: boolean }).shuffleQuestions ?? false,
      lockScreen: (exam as ExamSetType & { lockScreen?: boolean }).lockScreen ?? false,
      scheduledStart: exam.scheduledStart?.toISOString() || null,
      scheduledEnd: exam.scheduledEnd?.toISOString() || null,
      questionCount: exam._count.questions,
      submissionCount: exam._count.submissions,
      questionTypeCounts,
      totalPoints,
    };
  });
}



