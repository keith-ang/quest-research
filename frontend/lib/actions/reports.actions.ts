"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "../db";
import Report from "@/lib/db/models/report.model";
import { revalidatePath } from "next/cache";

export async function deleteReportById(
	id: string,
	userId: string
): Promise<{ success: boolean }> {
	try {
		await connectToDatabase();

		// Check if the id is a valid MongoDB ObjectId
		if (!mongoose.Types.ObjectId.isValid(id)) {
			console.error("Invalid report ID format");
			return { success: false };
		}

		// Attempt to find and delete the report
		const result = await Report.findOneAndDelete({
			_id: id,
			clerkUserId: userId,
		});

		if (result !== null) {
			revalidatePath("/dashboard");
			return { success: true };
		}

		return { success: false };
	} catch (error) {
		console.error(`Error deleting report ${id}:`, error);
		return { success: false };
	}
}
