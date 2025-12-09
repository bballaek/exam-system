import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Analytics for a specific exam set (per-question statistics)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get exam set with questions
    const examSet = await prisma.examSet.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: 'asc' }
        },
        submissions: {
          include: {
            answers: true
          }
        }
      }
    });

    if (!examSet) {
      return NextResponse.json({ error: 'Exam set not found' }, { status: 404 });
    }

    // Calculate analytics per question
    const questionAnalytics = examSet.questions.map((question) => {
      // Get all answers for this question
      const answersForQuestion = examSet.submissions.flatMap(sub => 
        sub.answers.filter(a => a.questionId === question.id)
      );

      const totalAnswers = answersForQuestion.length;
      const correctAnswers = answersForQuestion.filter(a => {
        // Use manualScore if available, otherwise isCorrect
        if (a.isManualGraded && a.manualScore !== null) {
          return a.manualScore >= a.maxPoints * 0.5; // 50%+ is "correct" for manual grading
        }
        return a.isCorrect;
      }).length;

      const percentage = totalAnswers > 0 
        ? Math.round((correctAnswers / totalAnswers) * 100) 
        : 0;

      // Average points earned
      const avgPointsEarned = totalAnswers > 0
        ? answersForQuestion.reduce((sum, a) => {
            const score = a.isManualGraded && a.manualScore !== null 
              ? a.manualScore 
              : a.pointsEarned;
            return sum + score;
          }, 0) / totalAnswers
        : 0;

      // Determine difficulty based on percentage
      let difficulty: 'easy' | 'medium' | 'hard';
      if (percentage >= 70) {
        difficulty = 'easy';
      } else if (percentage >= 40) {
        difficulty = 'medium';
      } else {
        difficulty = 'hard';
      }

      return {
        questionId: question.id,
        text: question.text,
        type: question.type,
        maxPoints: question.points,
        totalAnswers,
        correctAnswers,
        percentage,
        avgPointsEarned: Math.round(avgPointsEarned * 100) / 100,
        difficulty,
      };
    });

    // Overall statistics
    const totalSubmissions = examSet.submissions.length;
    const avgScore = totalSubmissions > 0
      ? Math.round(examSet.submissions.reduce((sum, s) => sum + s.score, 0) / totalSubmissions)
      : 0;
    const avgPercentage = examSet.submissions.length > 0 && examSet.submissions[0]?.totalPoints > 0
      ? Math.round((avgScore / examSet.submissions[0].totalPoints) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      examSetId: id,
      examTitle: examSet.title,
      totalSubmissions,
      avgScore,
      avgPercentage,
      questionAnalytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
