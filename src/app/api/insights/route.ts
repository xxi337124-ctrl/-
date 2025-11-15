import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const sortBy = searchParams.get("sortBy") || "time";
    const search = searchParams.get("search") || "";

    // Build where clause
    const where: any = {};

    // Filter by favorites
    if (filter === "favorites") {
      where.isFavorite = true;
    }

    // Filter by date range
    if (filter === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (filter === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    }

    // Search by keyword
    if (search) {
      where.keyword = { contains: search };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === "views") {
      orderBy.viewCount = "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const insights = await prisma.insight.findMany({
      where,
      orderBy,
    });

    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("获取洞察列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}
