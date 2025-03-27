// app/api/reports/create-placeholder/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Report from "@/lib/db/models/report.model";
import { currentUser } from "@clerk/nextjs/server";

//creates placeholder report object upon submission of form
export async function POST(request: Request) {
	try {
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

		const { topic } = await request.json();

		// Create a placeholder report with "in progress" status
		const placeholderReport = new Report({
			clerkUserId: clerkUserId,
			title: topic,
			rawReportContent: "",
			processedReportContent: "",
			status: "in progress",
			references: {},
		});

		const savedReport = await placeholderReport.save();

		return NextResponse.json({
			success: true,
			reportId: savedReport._id.toString(),
			message: "Report placeholder created",
		});
	} catch (error) {
		console.error("Error creating report placeholder:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to initialize report",
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 }
		);
	}
}
