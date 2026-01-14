import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE: Bulk delete submissions
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการที่ต้องการลบ" },
        { status: 400 }
      );
    }

    // Delete all submissions with cascade (answers will be deleted automatically)
    const result = await prisma.examSubmission.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `ลบ ${result.count} รายการเรียบร้อยแล้ว`
    });
  } catch (error) {
    console.error("Error bulk deleting submissions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
