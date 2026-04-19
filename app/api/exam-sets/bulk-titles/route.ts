import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST: Get titles for multiple exam set IDs
export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ titles: {} });
    }

    const examSets = await prisma.examSet.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
        title: true,
      },
    });

    // Convert to map for easy lookup
    const titles: Record<string, string> = {};
    examSets.forEach((exam) => {
      titles[exam.id] = exam.title;
    });

    return NextResponse.json({ titles });
  } catch (error) {
    console.error("Error fetching bulk titles:", error);
    return NextResponse.json(
      { error: "Failed to fetch titles" },
      { status: 500 }
    );
  }
}
