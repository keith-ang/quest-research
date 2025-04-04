// app/api/reports/[reportId]/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Report from "@/lib/db/models/report.model";
import mongoose from "mongoose";
import { currentUser } from "@clerk/nextjs/server";

// deletes initial report object that was created if report fails to generate
export async function DELETE(
	request: Request,
	{ params }: { params: { reportId: string } }
) {
	try {
		const { reportId } = await params;
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

		// Delete the report if it exists and belongs to the user
		const result = await Report.deleteOne({
			_id: reportId,
			clerkUserId: clerkUserId,
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
