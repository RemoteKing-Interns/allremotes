import { NextRequest, NextResponse } from "next/server";
import { LogEntry } from "@/lib/logger";
import { serverLogger } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Get logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const shouldExport = searchParams.get('export') === 'true';

    const filters: any = {};
    if (level) filters.level = level;
    if (action) filters.action = action;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    filters.limit = limit;
    filters.offset = offset;

    const { logs, total } = await serverLogger.getLogs(filters);

    if (shouldExport) {
      // Export as CSV
      const headers = ['Timestamp', 'Level', 'Action', 'User Email', 'IP', 'User Agent', 'Route', 'Method', 'Details'];
      const csvRows = [
        headers.join(','),
        ...logs.map((log: LogEntry) => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.action,
          log.userEmail || '',
          log.ip || '',
          log.userAgent || '',
          log.route || '',
          log.method || '',
          typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {})
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ];

      const csvContent = csvRows.join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="admin-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ logs, total });
  } catch (error: any) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// Receive client-side logs
export async function POST(request: NextRequest) {
  try {
    const { logs } = await request.json();

    if (!Array.isArray(logs)) {
      return NextResponse.json(
        { error: "Logs array is required" },
        { status: 400 }
      );
    }

    // Process each log entry
    for (const logEntry of logs) {
      await serverLogger.log({
        level: logEntry.level,
        action: logEntry.action,
        details: logEntry.details,
        userId: logEntry.userId,
        userEmail: logEntry.userEmail,
        ip: logEntry.ip,
        userAgent: logEntry.userAgent,
        route: logEntry.route,
        method: logEntry.method,
        statusCode: logEntry.statusCode,
        duration: logEntry.duration,
        error: logEntry.error,
        metadata: logEntry.metadata,
      });
    }

    return NextResponse.json({ success: true, processed: logs.length });
  } catch (error: any) {
    console.error("Error processing client logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process logs" },
      { status: 500 }
    );
  }
}

// Clear logs
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan');

    const date = olderThan ? new Date(olderThan) : undefined;
    await serverLogger.clearLogs(date);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error clearing logs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear logs" },
      { status: 500 }
    );
  }
}
