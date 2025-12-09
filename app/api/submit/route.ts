import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface StudentInfo {
  firstName: string;
  lastName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
}

interface SubmitPayload {
  examSetId: string;
  studentInfo: StudentInfo;
  userAnswers: (string | string[] | null)[];
}

// Helper function to normalize answer for comparison
function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

// Helper function to compare arrays (for CODEMSA questions)
function arraysMatch(userAnswers: string[], correctAnswers: string[]): boolean {
  if (userAnswers.length !== correctAnswers.length) return false;
  
  return correctAnswers.every((correct, index) => {
    const userAnswer = userAnswers[index] || '';
    return normalizeAnswer(userAnswer) === normalizeAnswer(correct);
  });
}

// POST: Submit exam answers and grade
export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { examSetId, studentInfo, userAnswers } = body;

    // Validate required fields
    if (!examSetId || !studentInfo || !userAnswers) {
      return NextResponse.json(
        { error: "Missing required fields: examSetId, studentInfo, or userAnswers" },
        { status: 400 }
      );
    }

    // 1. Fetch the ExamSet with its Questions (including correctAnswers and points)
    const examSet = await prisma.examSet.findUnique({
      where: { id: examSetId },
      include: {
        questions: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!examSet) {
      return NextResponse.json(
        { error: "ไม่พบชุดข้อสอบ" },
        { status: 404 }
      );
    }

    // 2. Grade the exam
    let score = 0;
    let totalPoints = 0;
    const gradedAnswers: {
      questionId: number;
      answerValue: string | string[] | null;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
    }[] = [];

    type QuestionType = typeof examSet.questions[number];
    examSet.questions.forEach((question: QuestionType, index: number) => {
      const userAnswer = userAnswers[index];
      const correctAnswers = question.correctAnswers;
      const points = question.points;
      
      totalPoints += points;
      
      let isCorrect = false;

      if (question.type === 'CODEMSA') {
        // CODEMSA: User answer is an array, compare all elements
        if (Array.isArray(userAnswer) && correctAnswers.length > 0) {
          isCorrect = arraysMatch(userAnswer, correctAnswers);
        }
      } else {
        // CHOICE or SHORT: Compare single answer with correctAnswers[0]
        if (typeof userAnswer === 'string' && correctAnswers.length > 0) {
          isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswers[0]);
        }
      }

      const pointsEarned = isCorrect ? points : 0;
      score += pointsEarned;

      gradedAnswers.push({
        questionId: question.id,
        answerValue: userAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: points,
      });
    });

    // 3. Database Transaction: Create ExamSubmission and StudentAnswers
    const studentName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim();

    const submission = await prisma.$transaction(async (tx) => {
      // Create ExamSubmission
      const newSubmission = await tx.examSubmission.create({
        data: {
          studentName,
          studentId: studentInfo.studentId,
          studentNumber: studentInfo.studentNumber || null,
          classroom: studentInfo.classroom || null,
          score,
          totalPoints,
          examSetId,
          answers: {
            create: gradedAnswers.map((graded) => ({
              questionId: graded.questionId,
              answerValue: graded.answerValue as object,
              isCorrect: graded.isCorrect,
              pointsEarned: graded.pointsEarned,
              maxPoints: graded.maxPoints,
            }))
          }
        },
        include: {
          answers: true
        }
      });

      return newSubmission;
    });

    // 4. Return success response
    return NextResponse.json({
      success: true,
      score,
      totalPoints,
      submissionId: submission.id,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
    });

  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
