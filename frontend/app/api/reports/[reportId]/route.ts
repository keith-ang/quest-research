import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Report from "@/lib/db/models/report.model";
import mongoose from "mongoose";
import { currentUser } from "@clerk/nextjs/server";

// Define the params type to match Next.js 15's expectations
interface ReportParams {
	params: Promise<{ reportId: string }>;
}

// Deletes the initial report object if report generation fails
export async function DELETE(
	request: Request,
	{ params }: ReportParams
): Promise<Response> {
	try {
		// Extract reportId by awaiting the params promise
		const resolvedParams = await params;
		const { reportId } = resolvedParams;

		await connectToDatabase();

		const user = await currentUser();
		if (!user) {
			return NextResponse.json(
				{ success: false, message: "Authentication required" },
				{ status: 401 }
			);
		}
		const clerkUserId = user.id;

		// Validate the report ID
		if (!mongoose.Types.ObjectId.isValid(reportId)) {
			return NextResponse.json(
				{ success: false, message: "Invalid report ID" },
				{ status: 400 }
			);
		}

		// Delete the report if it exists and belongs to the user
		const result = await Report.deleteOne({
			_id: reportId,
			clerkUserId,
		});

		if (result.deletedCount === 0) {
			return NextResponse.json(
				{
					success: false,
					message: "Report not found or access denied",
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Report deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting report:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to delete report",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}

export async function PATCH(
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
				{ success: false, message: "Authentication required" },
				{ status: 401 }
			);
		}
		const clerkUserId = user.id;

		// Validate the report ID
		if (!mongoose.Types.ObjectId.isValid(reportId)) {
			return NextResponse.json(
				{ success: false, message: "Invalid report ID" },
				{ status: 400 }
			);
		}

		// Get the update data
		const updateData = await request.json();

		// Update the report
		const updatedReport = await Report.findOneAndUpdate(
			{ _id: reportId, clerkUserId },
			{
				...updateData,
				updatedAt: new Date(),
			},
			{ new: true }
		);

		if (!updatedReport) {
			return NextResponse.json(
				{
					success: false,
					message: "Report not found or access denied",
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: "Report updated successfully",
			report: {
				id: updatedReport._id,
				title: updatedReport.title,
				status: updatedReport.status,
				createdAt: updatedReport.createdAt,
				updatedAt: updatedReport.updatedAt,
			},
		});
	} catch (error) {
		console.error("Error updating report:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to update report",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
