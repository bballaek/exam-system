import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// ฟังก์ชันสำหรับดึงข้อสอบ (GET)
export async function GET() {
  try {
    // 1. หาชุดข้อสอบที่เปิดอยู่ (isActive = true)
    const activeExam = await prisma.examSet.findFirst({
      where: { isActive: true },
      include: {
        questions: true // ดึงข้อสอบในชุดนั้นมาด้วย
      }
    });

    if (!activeExam) {
      return NextResponse.json({ error: "ไม่พบการสอบที่เปิดอยู่ในขณะนี้" }, { status: 404 });
    }

    // 2. สลับลำดับข้อสอบ (Shuffle) - Logic เดิมของคุณ
    const shuffledQuestions = activeExam.questions.sort(() => Math.random() - 0.5);

    // 3. ส่งข้อมูลกลับไปให้หน้าเว็บ (ตัดเฉลยออก เพื่อกันเด็กแอบดู network tab)
    const questionsForStudent = shuffledQuestions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      subQuestions: q.subQuestions,
      // ไม่ส่ง correctAnswers ไปนะครับ!
    }));

    return NextResponse.json({ 
      examTitle: activeExam.title,
      examId: activeExam.id, // ส่ง ID ชุดข้อสอบไปด้วย ไว้ใช้ตอนส่งคำตอบ
      questions: questionsForStudent 
    });

  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
