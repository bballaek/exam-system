import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

interface StudentInfo {
  firstName: string;
  lastName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
}

interface AnswerWithId {
  questionId: number;
  answer: string | string[] | null;
}

interface SubmitPayload {
  examSetId: string;
  studentInfo: StudentInfo;
  answersWithId: AnswerWithId[];
}

// Helper function to normalize answer for comparison
function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

// Helper function to compare arrays (for CODEMSA questions)
function arraysMatch(userAnswers: string[], correctAnswers: string[]): boolean {
  if (userAnswers.length !== correctAnswers.length) return false;
  
  return correctAnswers.every((correct, index) => {
    const userAnswer = userAnswers[index] || '';
    return normalizeAnswer(userAnswer) === normalizeAnswer(correct);
  });
}

// Sandbox execution helper for auto-grading
async function runPythonCode(code: string): Promise<{ stdout: string; stderr: string; success: boolean }> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'grade-run-'));
  const tempFile = path.join(tempDir, 'solution.py');
  await fs.writeFile(tempFile, code);

  try {
    const { stdout, stderr } = await execAsync(`python3 "${tempFile}"`, {
      timeout: 3000,
      maxBuffer: 512 * 1024,
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
  } catch (error: any) {
    return { 
      stdout: (error.stdout || '').trim(), 
      stderr: (error.stderr || error.message).trim(), 
      success: false 
    };
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// POST: Submit exam answers and grade
export async function POST(request: NextRequest) {
  try {
    const body: SubmitPayload = await request.json();
    const { examSetId, studentInfo, answersWithId } = body;

    // Validate required fields
    if (!examSetId || !studentInfo || !answersWithId) {
      return NextResponse.json(
        { error: "Missing required fields: examSetId, studentInfo, or answersWithId" },
        { status: 400 }
      );
    }

    // 1. Fetch the ExamSet with its Questions (including correctAnswers and points)
    const examSet = await prisma.examSet.findUnique({
      where: { id: examSetId },
      include: {
        questions: true // Don't need orderBy since we use questionId
      }
    });

    if (!examSet) {
      return NextResponse.json(
        { error: "ไม่พบชุดข้อสอบ" },
        { status: 404 }
      );
    }

    // Create a map of questions by ID for quick lookup
    const questionsMap = new Map(
      examSet.questions.map(q => [q.id, q])
    );

    // 2. Grade the exam
    let score = 0;
    let totalPoints = 0;
    const gradedAnswers: {
      questionId: number;
      answerValue: string | string[] | null;
      isCorrect: boolean;
      pointsEarned: number;
      maxPoints: number;
    }[] = [];

    // Process each answer by questionId
    for (const answerData of answersWithId) {
      const question = questionsMap.get(answerData.questionId);
      
      if (!question) {
        console.warn(`Question ${answerData.questionId} not found, skipping`);
        continue;
      }

      const userAnswer = answerData.answer;
      const correctAnswers = question.correctAnswers;
      const points = question.points;
      
      totalPoints += points;
      
      let isCorrect = false;

      if (question.type === 'CODEMSA') {
        // CODEMSA: Check if we can use sandbox
        if (Array.isArray(userAnswer) && question.subQuestions.length > 0) {
          // 1. Try String matching first (fast)
          isCorrect = arraysMatch(userAnswer, question.correctAnswers);
          
          // 2. If string match fails, try Sandbox execution (Golden Output comparison)
          if (!isCorrect) {
            // Assemble student code
            let studentCode = question.text;
            question.subQuestions.forEach((subQ, idx) => {
              studentCode = studentCode.split(subQ).join(String(userAnswer[idx] || ''));
            });

            // Assemble golden code (using correctAnswers)
            let goldenCode = question.text;
            question.subQuestions.forEach((subQ, idx) => {
              goldenCode = goldenCode.split(subQ).join(String(question.correctAnswers[idx] || ''));
            });

            // Run both
            const [studentRes, goldenRes] = await Promise.all([
              runPythonCode(studentCode),
              runPythonCode(goldenCode)
            ]);

            // If both succeed and outputs match, it's correct!
            if (studentRes.success && goldenRes.success && studentRes.stdout === goldenRes.stdout) {
              isCorrect = true;
            }
          }
        }
      } else {
        // CHOICE or SHORT: Compare single answer with correctAnswers[0]
        if (typeof userAnswer === 'string' && correctAnswers.length > 0) {
          isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswers[0]);
        }
      }

      const pointsEarned = isCorrect ? points : 0;
      score += pointsEarned;

      gradedAnswers.push({
        questionId: question.id,
        answerValue: userAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: points,
      });
    }

    // 3. Database Transaction: Create ExamSubmission and StudentAnswers
    const studentName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim();

    const submission = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create ExamSubmission
      const newSubmission = await tx.examSubmission.create({
        data: {
          studentName,
          studentId: studentInfo.studentId,
          studentNumber: studentInfo.studentNumber || null,
          classroom: studentInfo.classroom || null,
          score,
          totalPoints,
          examSetId,
          answers: {
            create: gradedAnswers.map((graded) => ({
              questionId: graded.questionId,
              answerValue: graded.answerValue as object,
              isCorrect: graded.isCorrect,
              pointsEarned: graded.pointsEarned,
              maxPoints: graded.maxPoints,
            }))
          }
        },
        include: {
          answers: true
        }
      });

      return newSubmission;
    });

    // 4. Return success response
    return NextResponse.json({
      success: true,
      score,
      totalPoints,
      submissionId: submission.id,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0
    });

  } catch (error) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
