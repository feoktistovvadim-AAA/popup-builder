import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/org";

type TimeRange = "24h" | "7d" | "30d" | "all";

function getDateFilter(range: TimeRange): Date | null {
    const now = new Date();
    switch (range) {
        case "24h":
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case "7d":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case "30d":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "all":
            return null;
        default:
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // default 7d
    }
}

export async function GET(request: Request) {
    try {
        const context = await getOrgContext();
        if (!context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = (searchParams.get("range") || "7d") as TimeRange;
        const dateFilter = getDateFilter(range);

        // Get all popups for this org
        const popups = await prisma.popup.findMany({
            where: {
                site: {
                    organizationId: context.organizationId,
                },
            },
            include: {
                site: true,
            },
        });

        // Get events for all popups in this org
        const events = await prisma.event.findMany({
            where: {
                popupId: {
                    in: popups.map((p) => p.id),
                },
                ...(dateFilter ? { timestamp: { gte: dateFilter } } : {}),
            },
            select: {
                popupId: true,
                eventType: true,
            },
        });

        // Aggregate stats per popup
        const statsMap = new Map<
            string,
            { impressions: number; clicks: number; closes: number }
        >();

        events.forEach((event) => {
            if (!statsMap.has(event.popupId)) {
                statsMap.set(event.popupId, { impressions: 0, clicks: 0, closes: 0 });
            }
            const stats = statsMap.get(event.popupId)!;
            if (event.eventType === "impression") stats.impressions++;
            if (event.eventType === "click") stats.clicks++;
            if (event.eventType === "close") stats.closes++;
        });

        // Build response
        const result = popups.map((popup) => {
            const stats = statsMap.get(popup.id) || {
                impressions: 0,
                clicks: 0,
                closes: 0,
            };
            const ctr =
                stats.impressions > 0
                    ? (stats.clicks / stats.impressions) * 100
                    : 0;
            const closeRate =
                stats.impressions > 0
                    ? (stats.closes / stats.impressions) * 100
                    : 0;

            return {
                popupId: popup.id,
                popupName: popup.name,
                impressions: stats.impressions,
                clicks: stats.clicks,
                ctr: Math.round(ctr * 100) / 100, // 2 decimal places
                closes: stats.closes,
                closeRate: Math.round(closeRate * 100) / 100,
            };
        });

        return NextResponse.json({ popups: result });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
