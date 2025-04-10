import { ReportSection } from "@/types";
import { toast } from "sonner";

// Parse the Markdown sections with hierarchy support
export const parseReportContent = (content: string): ReportSection[] => {
	// Split the content by headings
	const lines = content.split("\n");
	const sections: ReportSection[] = [];

	let currentH1 = ""; // Initialize as empty string instead of null
	let sectionLines: string[] = [];
	let currentLevel = 0;
	let currentTitle = "";

	// Process each line
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Check if the line is a heading
		if (line.startsWith("#")) {
			// If we have accumulated content for a previous section, save it
			if (currentTitle && sectionLines.length > 0) {
				// Filter out sections with empty content (just whitespace)
				const contentText = sectionLines.join("\n").trim();
				if (contentText) {
					sections.push({
						title: getFormattedTitle(
							currentTitle,
							currentLevel,
							currentH1
						),
						content: contentText,
						level: currentLevel,
						parentTitle:
							currentLevel > 1 && currentH1
								? currentH1
								: undefined,
					});
				}
				sectionLines = [];
			}

			// Count the number of # to determine heading level
			const match = line.match(/^(#+)\s+(.*)/);
			if (match) {
				currentLevel = match[1].length;
				currentTitle = match[2].trim();

				// Store h1 titles for reference by lower-level headings
				if (currentLevel === 1) {
					currentH1 = currentTitle;
				}
			}
		} else {
			// Add content to the current section
			sectionLines.push(line);
		}
	}

	// Add the last section if there's any content left
	if (currentTitle && sectionLines.length > 0) {
		// Filter out sections with empty content (just whitespace)
		const contentText = sectionLines.join("\n").trim();
		if (contentText) {
			sections.push({
				title: getFormattedTitle(currentTitle, currentLevel, currentH1),
				content: contentText,
				level: currentLevel,
				parentTitle:
					currentLevel > 1 && currentH1 ? currentH1 : undefined,
			});
		}
	}

	return sections;
};

// Format the title based on heading level
const getFormattedTitle = (
	title: string,
	level: number,
	parentTitle: string
): string => {
	if (level === 1 || !parentTitle) {
		return title.charAt(0).toUpperCase() + title.slice(1);
	}
	// For h2 and lower, format as "Parent > Child"
	return `${parentTitle} > ${title}`;
};

export const updateReportWithWebSocketData = async (
	reportId: string,
	data: {
		raw_content: string;
		processed_content: string;
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		references: any;
	}
) => {
	try {
		console.log("Making PATCH request to update report", reportId);
		const response = await fetch(`/api/reports/${reportId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				rawReportContent: data.raw_content,
				processedReportContent: data.processed_content,
				references: data.references,
				status: "completed",
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to update report with generated content");
		}

		console.log("Report updated successfully");
		toast.success("Report updated successfully");
		return true;
	} catch (error) {
		console.error("Error updating report:", error);
		toast.error("Failed to update report with generated content");
		return false;
	}
};

export const deletePlaceholderReport = async (reportId: string) => {
	try {
		console.log("Deleting placeholder report:", reportId);
		const response = await fetch(`/api/reports/${reportId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error(`Failed to delete report: ${response.status}`);
		}

		console.log("Placeholder report deleted successfully");
		return true;
	} catch (error) {
		console.error("Error deleting placeholder report:", error);
		throw error;
	}
};
