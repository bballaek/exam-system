import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface QuestionData {
  text: string;
  type: 'CHOICE' | 'SHORT' | 'CODEMSA';
  points: number;
  options: string[];
  correctAnswers: string[];
  subQuestions: string[];
}

interface BulkImportBody {
  examSetId: string;
  questions: QuestionData[];
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkImportBody = await request.json();

    if (!body.examSetId) {
      return NextResponse.json(
        { error: 'examSetId is required' },
        { status: 400 }
      );
    }

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json(
        { error: 'questions array is required' },
        { status: 400 }
      );
    }

    // Verify exam set exists
    const examSet = await prisma.examSet.findUnique({
      where: { id: body.examSetId },
    });

    if (!examSet) {
      return NextResponse.json(
        { error: 'Exam set not found' },
        { status: 404 }
      );
    }

    // Create all questions
    const createdQuestions = await prisma.question.createMany({
      data: body.questions.map((q) => ({
        examSetId: body.examSetId,
        text: q.text,
        type: q.type,
        points: q.points || 1,
        options: q.options || [],
        correctAnswers: q.correctAnswers || [],
        subQuestions: q.subQuestions || [],
      })),
    });

    return NextResponse.json({
      success: true,
      count: createdQuestions.count,
      message: `นำเข้าคำถามสำเร็จ ${createdQuestions.count} ข้อ`,
    });
  } catch (error) {
    console.error('Error bulk importing questions:', error);
    return NextResponse.json(
      { error: 'Failed to import questions' },
      { status: 500 }
    );
  }
}
