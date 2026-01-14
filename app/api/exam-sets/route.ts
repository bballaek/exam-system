import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all exam sets
export async function GET() {
  try {
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
    const formattedExamSets = examSets.map((exam: ExamSetType) => {
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
        instructions: Array.isArray((exam as ExamSetType & { instructions?: any }).instructions)
          ? (exam as ExamSetType & { instructions?: any }).instructions
          : null,
        questionCount: exam._count.questions,
        submissionCount: exam._count.submissions,
        questionTypeCounts,
        totalPoints,
        _count: exam._count
      };
    });

    return NextResponse.json({
      success: true,
      examSets: formattedExamSets
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error("Error fetching exam sets:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Create new exam set
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const examSet = await prisma.examSet.create({
      data: {
        title: body.title,
        description: body.description || null,
        subject: body.subject || null,
        timeLimitMinutes: body.timeLimitMinutes || null,
        ...(body.instructions && { instructions: body.instructions }),
        isActive: false,
      } as any, // Temporary type assertion until migration is run
    });

    return NextResponse.json(examSet, { status: 201 });
  } catch (error) {
    console.error("Error creating exam set:", error);
    return NextResponse.json(
      { error: "Failed to create exam set" },
      { status: 500 }
    );
  }
}
