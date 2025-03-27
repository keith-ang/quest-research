import mongoose, { Schema, Document } from "mongoose";
import { ReportDetailsProps } from "@/types";

// Define the main Report schema to exactly match ReportDetailsProps
const ReportSchema = new Schema(
	{
		clerkUserId: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		rawReportContent: {
			type: String,
			// required: true,
		},
		processedReportContent: {
			type: String,
			// required: true,
		},
		status: {
			type: String,
			enum: ["completed", "in progress"],
			required: true,
		},
		references: {
			type: Schema.Types.Mixed,
			// required: true,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt
		strict: true, // Change to true to ensure only defined fields are used
	}
);

const Report =
	mongoose.models.Report ||
	mongoose.model<ReportDetailsProps & Document>("Report", ReportSchema);

export default Report;
