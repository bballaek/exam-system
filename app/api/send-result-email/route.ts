import { NextRequest, NextResponse } from 'next/server';

interface EmailPayload {
  email: string;
  studentName: string;
  examTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailPayload = await request.json();
    const { email, studentName, examTitle, score, totalPoints, percentage, grade } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมลที่ถูกต้อง' },
        { status: 400 }
      );
    }

    // For now, we'll simulate sending an email
    // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the email content (for debugging)
    console.log('=== Sending Result Email ===');
    console.log('To:', email);
    console.log('Student:', studentName);
    console.log('Exam:', examTitle);
    console.log('Score:', `${score}/${totalPoints} (${percentage}%)`);
    console.log('Grade:', grade);
    console.log('===========================');

    // In production, integrate with email service here
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'noreply@masterexam.com',
    //   to: email,
    //   subject: `ผลสอบ: ${examTitle}`,
    //   html: `<h1>ผลการสอบ</h1>...`
    // });

    return NextResponse.json({
      success: true,
      message: `ส่งผลสอบไปที่ ${email} เรียบร้อยแล้ว`
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถส่งอีเมลได้' },
      { status: 500 }
    );
  }
}
