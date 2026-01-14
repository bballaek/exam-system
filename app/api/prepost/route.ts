import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Get all pre-post pairs with analysis data
export async function GET() {
  try {
    // Get all pre-post test exams grouped by pairId
    const examSets = await prisma.examSet.findMany({
      where: {
        examType: {
          in: ['pretest', 'posttest']
        },
        pairId: {
          not: null
        }
      },
      include: {
        submissions: {
          select: {
            id: true,
            studentId: true,
            studentName: true,
            classroom: true,
            score: true,
            totalPoints: true,
          }
        },
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by pairId
    const pairMap = new Map<string, {
      pairId: string;
      pretest: typeof examSets[0] | null;
      posttest: typeof examSets[0] | null;
    }>();

    examSets.forEach(exam => {
      if (!exam.pairId) return;
      
      if (!pairMap.has(exam.pairId)) {
        pairMap.set(exam.pairId, {
          pairId: exam.pairId,
          pretest: null,
          posttest: null
        });
      }
      
      const pair = pairMap.get(exam.pairId)!;
      if (exam.examType === 'pretest') {
        pair.pretest = exam;
      } else if (exam.examType === 'posttest') {
        pair.posttest = exam;
      }
    });

    // Convert to array and calculate analysis for each pair
    const pairs = Array.from(pairMap.values()).map(pair => {
      if (!pair.pretest || !pair.posttest) {
        return {
          ...pair,
          analysis: null
        };
      }

      // Match students by studentId
      const preSubmissions = pair.pretest.submissions;
      const postSubmissions = pair.posttest.submissions;

      const matchedStudents = preSubmissions.map(pre => {
        const post = postSubmissions.find(p => p.studentId === pre.studentId);
        const prePercentage = Math.round((pre.score / pre.totalPoints) * 100);
        const postPercentage = post ? Math.round((post.score / post.totalPoints) * 100) : null;
        
        return {
          studentName: pre.studentName,
          studentId: pre.studentId,
          classroom: pre.classroom,
          preScore: prePercentage,
          postScore: postPercentage,
          change: postPercentage !== null ? postPercentage - prePercentage : null,
          status: postPercentage === null 
            ? 'incomplete' 
            : postPercentage > prePercentage 
              ? 'improved' 
              : postPercentage < prePercentage 
                ? 'declined' 
                : 'same'
        };
      });

      // Calculate summary stats
      const completedStudents = matchedStudents.filter(s => s.postScore !== null);
      const preAvg = completedStudents.length > 0 
        ? Math.round(completedStudents.reduce((sum, s) => sum + s.preScore, 0) / completedStudents.length)
        : 0;
      const postAvg = completedStudents.length > 0
        ? Math.round(completedStudents.reduce((sum, s) => sum + (s.postScore || 0), 0) / completedStudents.length)
        : 0;
      const avgChange = postAvg - preAvg;
      const improvedCount = completedStudents.filter(s => s.status === 'improved').length;
      const declinedCount = completedStudents.filter(s => s.status === 'declined').length;

      return {
        pairId: pair.pairId,
        pretest: {
          id: pair.pretest.id,
          title: pair.pretest.title,
          submissionCount: preSubmissions.length
        },
        posttest: {
          id: pair.posttest.id,
          title: pair.posttest.title,
          submissionCount: postSubmissions.length
        },
        analysis: {
          totalStudents: preSubmissions.length,
          completedBoth: completedStudents.length,
          preAvg,
          postAvg,
          avgChange,
          improvedCount,
          declinedCount,
          sameCount: completedStudents.length - improvedCount - declinedCount,
          students: matchedStudents
        }
      };
    });

    // Filter out incomplete pairs (without both pre and post)
    const completePairs = pairs.filter(p => p.analysis !== null);

    return NextResponse.json({ pairs: completePairs });
  } catch (error) {
    console.error('Error fetching pre-post analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pre-post analysis' },
      { status: 500 }
    );
  }
}
