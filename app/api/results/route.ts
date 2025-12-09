import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all exam submissions with optional examSetId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examSetId = searchParams.get('examSetId');

    // Build where clause
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

    // Format submissions for the frontend
    const formattedSubmissions = submissions.map(sub => ({
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

    return NextResponse.json({
      success: true,
      submissions: formattedSubmissions,
      total: formattedSubmissions.length
    });

  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
