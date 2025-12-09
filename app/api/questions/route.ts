import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST create new question
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const question = await prisma.question.create({
      data: {
        text: body.text || "คำถามใหม่",
        type: body.type || "CHOICE",
        points: body.points || 1,
        options: body.options || ["ตัวเลือก ก", "ตัวเลือก ข", "ตัวเลือก ค", "ตัวเลือก ง"],
        correctAnswers: body.correctAnswers || ["ตัวเลือก ก"],
        subQuestions: body.subQuestions || [],
        examSetId: body.examSetId,
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error) {
    console.error("Error creating question:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
