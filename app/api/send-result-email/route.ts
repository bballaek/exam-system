import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailPayload {
  email: string;
  studentName: string;
  examTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  grade: string;
}

function getGradeColor(percentage: number): string {
  if (percentage >= 80) return '#22c55e'; // green
  if (percentage >= 60) return '#3b82f6'; // blue
  if (percentage >= 40) return '#eab308'; // yellow
  return '#ef4444'; // red
}

function generateEmailHTML(data: EmailPayload): string {
  const gradeColor = getGradeColor(data.percentage);
  const date = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 ผลการสอบ</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">${data.examTitle}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Student Name -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">ผู้สอบ</p>
              <p style="margin: 5px 0 0 0; color: #111827; font-size: 18px; font-weight: bold;">${data.studentName}</p>
            </div>
            
            <!-- Score -->
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 48px; font-weight: bold; color: ${gradeColor};">
                ${data.score}<span style="color: #9ca3af; font-size: 24px;"> / ${data.totalPoints}</span>
              </div>
              <p style="color: #6b7280; margin: 5px 0 0 0;">คะแนนที่ได้</p>
            </div>
            
            <!-- Progress Bar -->
            <div style="margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                <span>ความสำเร็จ</span>
                <span>${data.percentage}%</span>
              </div>
              <div style="background-color: #e5e7eb; border-radius: 10px; height: 10px; overflow: hidden;">
                <div style="background-color: ${gradeColor}; height: 100%; width: ${data.percentage}%; border-radius: 10px;"></div>
              </div>
            </div>
            
            <!-- Grade Badge -->
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: ${gradeColor}; color: white; padding: 10px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
                ${data.grade}
              </span>
            </div>
            
            <!-- Date -->
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 0;">
              วันที่สอบ: ${date}
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              ส่งโดย MasterExam 📚
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
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

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'MasterExam <onboarding@resend.dev>',
      to: email,
      subject: `📋 ผลสอบ: ${examTitle} - ${grade}`,
      html: generateEmailHTML({ email, studentName, examTitle, score, totalPoints, percentage, grade }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'ไม่สามารถส่งอีเมลได้' },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      message: `ส่งผลสอบไปที่ ${email} เรียบร้อยแล้ว`,
      emailId: data?.id
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'ไม่สามารถส่งอีเมลได้' },
      { status: 500 }
    );
  }
}
