// app/api/reports/generate/[reportId]/route.ts
import { NextResponse } from "next/server";
import { reportFormSchema } from "@/lib/validator";
import { IReportForm } from "@/types";
import { connectToDatabase } from "@/lib/db";
import Report from "@/lib/db/models/report.model";
import mongoose from "mongoose";
import { currentUser } from "@clerk/nextjs/server";

interface ReportParams {
	params: Promise<{ reportId: string }>;
}

// updates the initial report object with the content and references if report from backend is generated successfully
export async function POST(
	request: Request,
	{ params }: ReportParams
): Promise<Response> {
	try {
		const resolvedParams = await params;
		const { reportId } = resolvedParams;
		await connectToDatabase();

		const user = await currentUser();
		if (!user) {
			return NextResponse.json(
				{
					success: false,
					message: "Authentication required",
				},
				{ status: 401 }
			);
		}
		const clerkUserId = user?.id;

		// Validate the report ID
		if (!mongoose.Types.ObjectId.isValid(reportId)) {
			return NextResponse.json(
				{
					success: false,
					message: "Invalid report ID",
				},
				{ status: 400 }
			);
		}

		// Check if the report exists and belongs to the user
		const existingReport = await Report.findOne({
			_id: reportId,
			clerkUserId: clerkUserId,
		});

		if (!existingReport) {
			return NextResponse.json(
				{
					success: false,
					message: "Report not found or access denied",
				},
				{ status: 404 }
			);
		}

		// Parse the request body for report generation parameters
		const body = await request.json();
		const parseResult = reportFormSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					success: false,
					message: "Validation failed",
					errors: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const formData: IReportForm = parseResult.data;

		console.log("Processing report with topic:", formData.topic);
		const apiUrl =
			process.env.NEXT_PUBLIC_STORM_API_URL || "http://localhost:8000";
		console.log(`Calling API URL: ${apiUrl}`);

		// Call FastAPI route to generate report content and references
		// Pass the report ID to establish the WebSocket connection
		await fetch(`${apiUrl}/api/articles`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				topic: formData.topic,
				report_id: reportId, // Include report_id for WebSocket updates
				// can add more params in future
			}),
		});

		// We don't need to wait for the full response anymore
		// since updates will come via WebSocket

		// Return immediately to avoid timeout
		return NextResponse.json({
			success: true,
			reportId: reportId,
			message: "Report generation started",
		});
	} catch (error) {
		console.error("Error processing report request:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to process request",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
