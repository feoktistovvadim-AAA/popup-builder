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
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
}

export async function GET(
    request: Request,
    { params }: { params: { popupId: string } | Promise<{ popupId: string }> }
) {
    try {
        const context = await getOrgContext();
        if (!context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        const popupId = resolvedParams.popupId;

        // Verify popup belongs to org
        const popup = await prisma.popup.findUnique({
            where: { id: popupId },
            include: { site: true },
        });

        if (!popup || popup.site.organizationId !== context.organizationId) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const range = (searchParams.get("range") || "7d") as TimeRange;
        const dateFilter = getDateFilter(range);

        // Get all events for this popup
        const events = await prisma.event.findMany({
            where: {
                popupId,
                ...(dateFilter ? { timestamp: { gte: dateFilter } } : {}),
            },
            select: {
                eventType: true,
                timestamp: true,
                pageUrl: true,
                deviceType: true,
                triggerType: true,
            },
            orderBy: {
                timestamp: "asc",
            },
        });

        // Timeseries (daily buckets)
        const timeseriesMap = new Map<
            string,
            { impressions: number; clicks: number }
        >();
        events.forEach((event) => {
            const date = new Date(event.timestamp).toISOString().split("T")[0];
            if (!timeseriesMap.has(date)) {
                timeseriesMap.set(date, { impressions: 0, clicks: 0 });
            }
            const bucket = timeseriesMap.get(date)!;
            if (event.eventType === "impression") bucket.impressions++;
            if (event.eventType === "click") bucket.clicks++;
        });

        const timeseries = Array.from(timeseriesMap.entries())
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Top pages
        const pageMap = new Map<string, number>();
        events.forEach((event) => {
            if (event.eventType === "impression" && event.pageUrl) {
                pageMap.set(event.pageUrl, (pageMap.get(event.pageUrl) || 0) + 1);
            }
        });
        const topPages = Array.from(pageMap.entries())
            .map(([url, impressions]) => ({ url, impressions }))
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 10);

        // Top triggers
        const triggerMap = new Map<string, number>();
        events.forEach((event) => {
            if (event.eventType === "impression" && event.triggerType) {
                triggerMap.set(
                    event.triggerType,
                    (triggerMap.get(event.triggerType) || 0) + 1
                );
            }
        });
        const topTriggers = Array.from(triggerMap.entries())
            .map(([trigger, count]) => ({ trigger, count }))
            .sort((a, b) => b.count - a.count);

        // Device breakdown
        const deviceBreakdown = { desktop: 0, mobile: 0 };
        events.forEach((event) => {
            if (event.eventType === "impression") {
                if (event.deviceType === "desktop") deviceBreakdown.desktop++;
                else if (event.deviceType === "mobile") deviceBreakdown.mobile++;
            }
        });

        // Trigger breakdown
        const triggerBreakdown: Record<string, number> = {};
        triggerMap.forEach((count, trigger) => {
            triggerBreakdown[trigger] = count;
        });

        return NextResponse.json({
            timeseries,
            topPages,
            topTriggers,
            deviceBreakdown,
            triggerBreakdown,
        });
    } catch (error) {
        console.error("Analytics detail error:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}
