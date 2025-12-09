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
        }
      }
    });

    const formattedExamSets = examSets.map(exam => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      isActive: exam.isActive,
      createdAt: exam.createdAt.toISOString(),
      timeLimitMinutes: exam.timeLimitMinutes,
      shuffleQuestions: exam.shuffleQuestions,
      scheduledStart: exam.scheduledStart?.toISOString() || null,
      scheduledEnd: exam.scheduledEnd?.toISOString() || null,
      questionCount: exam._count.questions,
      submissionCount: exam._count.submissions,
      _count: exam._count
    }));

    return NextResponse.json({
      success: true,
      examSets: formattedExamSets
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
        isActive: false,
      },
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
