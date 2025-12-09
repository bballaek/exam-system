import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get single submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const submission = await prisma.examSubmission.findUnique({
      where: { id },
      include: {
        answers: true,
        examSet: true
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

// DELETE: Delete submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete submission (answers will be cascade deleted due to schema)
    await prisma.examSubmission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "ลบเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
