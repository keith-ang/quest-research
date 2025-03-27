import { ReportDetailsProps } from "@/types";
import mongoose from "mongoose";
import Report from "@/lib/db/models/report.model";
import { connectToDatabase } from "./db";

export function getReadingTime(reportContent: string): number {
	const words = reportContent.trim().split(/\s+/);
	return Math.ceil((words.length || 0) / 200);
}

export async function getReportById(
	id: string,
	userId: string
): Promise<ReportDetailsProps | null> {
	try {
		await connectToDatabase();
		// Check if the id is a valid MongoDB ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			return null;
		}

		// Use the Mongoose model to find the report and convert to plain object with lean()
		const report = await Report.findOne({
			_id: id,
			clerkUserId: userId, // Make sure this matches your schema field name
		});

		if (!report) {
			return null;
		}

		const reportObj = report.toObject();

		// Explicitly map the document fields to match ReportDetailsProps
		const reportDetails: ReportDetailsProps = {
			_id: reportObj._id.toString(),
			clerkUserId: reportObj.clerkUserId,
			title: reportObj.title,
			rawReportContent: reportObj.rawReportContent,
			processedReportContent: reportObj.processedReportContent,
			status: reportObj.status as "completed" | "in progress",
			createdAt: reportObj.createdAt,
			updatedAt: reportObj.updatedAt,
			references: reportObj.references,
		};

		return reportDetails;
	} catch (error) {
		console.error("Error retrieving report:", error);
		return null;
	}
}

export async function getAllReportsForUser(
	userId: string
): Promise<ReportDetailsProps[]> {
	try {
		await connectToDatabase();

		// Use the Mongoose model to find all reports for the user
		const reportDocs = await Report.find({
			clerkUserId: userId,
		}).sort({ createdAt: -1 });

		// Explicitly map each document to match ReportDetailsProps
		const reports: ReportDetailsProps[] = reportDocs.map((doc) => {
			const reportObj = doc.toObject();
			return {
				_id: reportObj._id.toString(),
				clerkUserId: reportObj.clerkUserId,
				title: reportObj.title,
				rawReportContent: reportObj.rawReportContent,
				processedReportContent: reportObj.processedReportContent,
				status: reportObj.status as "completed" | "in progress",
				createdAt: reportObj.createdAt,
				updatedAt: reportObj.updatedAt,
				references: reportObj.references,
			};
		});

		return reports;
	} catch (error) {
		console.error("Error retrieving reports:", error);
		return [];
	}
}
