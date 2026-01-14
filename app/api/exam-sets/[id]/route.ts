import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET exam set with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const examSet = await prisma.examSet.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!examSet) {
      return NextResponse.json(
        { error: "Exam set not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(examSet);
  } catch (error) {
    console.error("Error fetching exam set:", error);
    return NextResponse.json(
      { error: "Failed to fetch exam set" },
      { status: 500 }
    );
  }
}

// PATCH update exam set
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update data, only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    
    // Scheduling fields
    if (body.scheduledStart !== undefined) {
      updateData.scheduledStart = body.scheduledStart ? new Date(body.scheduledStart) : null;
    }
    if (body.scheduledEnd !== undefined) {
      updateData.scheduledEnd = body.scheduledEnd ? new Date(body.scheduledEnd) : null;
    }
    if (body.timeLimitMinutes !== undefined) {
      updateData.timeLimitMinutes = body.timeLimitMinutes;
    }
    if (body.shuffleQuestions !== undefined) {
      updateData.shuffleQuestions = body.shuffleQuestions;
    }
    if (body.lockScreen !== undefined) {
      updateData.lockScreen = body.lockScreen;
    }
    if (body.instructions !== undefined) {
      updateData.instructions = body.instructions || null;
    }

    const examSet = await prisma.examSet.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(examSet);
  } catch (error) {
    console.error("Error updating exam set:", error);
    // Return detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = (error as any)?.code;
    const meta = (error as any)?.meta;
    
    // Log full error for debugging
    console.error("Full error details:", { errorCode, errorMessage, meta, error });
    
    return NextResponse.json(
      { error: "Failed to update exam set", details: errorMessage, code: errorCode },
      { status: 500 }
    );
  }
}

// DELETE exam set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related data first (cascade)
    await prisma.question.deleteMany({
      where: { examSetId: id },
    });

    // Delete submissions and their answers
    const submissions = await prisma.examSubmission.findMany({
      where: { examSetId: id },
      select: { id: true },
    });

    for (const sub of submissions) {
      await prisma.studentAnswer.deleteMany({
        where: { submissionId: sub.id },
      });
    }

    await prisma.examSubmission.deleteMany({
      where: { examSetId: id },
    });

    // Finally delete the exam set
    await prisma.examSet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exam set:", error);
    return NextResponse.json(
      { error: "Failed to delete exam set" },
      { status: 500 }
    );
  }
}
