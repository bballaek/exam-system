import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get submission with answers for grading
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const submission = await prisma.examSubmission.findUnique({
      where: { id },
      include: {
        answers: {
          orderBy: { questionId: 'asc' }
        },
        examSet: {
          include: {
            questions: {
              orderBy: { id: 'asc' }
            }
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Update manual grades
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { grades, gradedBy } = body; // grades: { answerId: string, score: number }[]

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: "Missing grades array" }, { status: 400 });
    }

    // Update each answer with manual score
    const updates = grades.map(async (grade: { answerId: string; score: number }) => {
      return prisma.studentAnswer.update({
        where: { id: grade.answerId },
        data: {
          manualScore: grade.score,
          isManualGraded: true,
          gradedBy: gradedBy || 'admin',
          gradedAt: new Date(),
        }
      });
    });

    await Promise.all(updates);

    // Recalculate total score
    const submission = await prisma.examSubmission.findUnique({
      where: { id },
      include: { answers: true }
    });

    if (submission) {
      type AnswerType = typeof submission.answers[number];
      const newScore = submission.answers.reduce((sum: number, answer: AnswerType) => {
        // Use manualScore if available, otherwise use pointsEarned
        const score = answer.manualScore !== null ? answer.manualScore : answer.pointsEarned;
        return sum + score;
      }, 0);

      await prisma.examSubmission.update({
        where: { id },
        data: { score: newScore }
      });

      return NextResponse.json({ 
        success: true, 
        message: "อัปเดตคะแนนเรียบร้อยแล้ว",
        newScore
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "อัปเดตคะแนนเรียบร้อยแล้ว",
      newScore: 0
    });
  } catch (error) {
    console.error("Error updating grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
