import prisma from '@/lib/prisma';

export interface Submission {
  id: string;
  studentName: string;
  studentId: string;
  studentNumber?: string | null;
  classroom?: string | null;
  score: number;
  totalPoints: number;
  percentage: number;
  examTitle: string;
  examSetId: string;
  submittedAt: string;
}

export async function getSubmissions(examSetId?: string): Promise<Submission[]> {
  const whereClause = examSetId ? { examSetId } : {};

  const submissions = await prisma.examSubmission.findMany({
    where: whereClause,
    orderBy: {
      submittedAt: 'desc'
    },
    include: {
      examSet: {
        select: {
          title: true
        }
      },
      answers: true
    }
  });

  type SubmissionType = typeof submissions[number];
  return submissions.map((sub: SubmissionType) => ({
    id: sub.id,
    studentName: sub.studentName,
    studentId: sub.studentId,
    studentNumber: sub.studentNumber,
    classroom: sub.classroom,
    score: sub.score,
    totalPoints: sub.totalPoints,
    percentage: sub.totalPoints > 0 ? Math.round((sub.score / sub.totalPoints) * 100) : 0,
    examTitle: sub.examSet.title,
    examSetId: sub.examSetId,
    submittedAt: sub.submittedAt.toISOString(),
    answerCount: sub.answers.length
  }));
}



