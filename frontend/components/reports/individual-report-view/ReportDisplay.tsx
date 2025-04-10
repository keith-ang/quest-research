"use client";

import React, { useState } from "react";
import ReportSectionDisplay from "./ReportSectionDisplay";
import { ReportDetailsProps } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "../../ui/progress";
import { parseReportContent } from "@/utils/reports";

interface ReportDisplayProps {
	report: ReportDetailsProps;
	showFullReport: boolean;
}

export default function ReportDisplay({
	report,
	showFullReport,
}: ReportDisplayProps) {
	// Parse the report content
	const sections = parseReportContent(report.rawReportContent);

	// State for carousel
	const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

	// Navigation functions
	const goToNextSection = () => {
		setCurrentSectionIndex((prev) =>
			prev === sections.length - 1 ? prev : prev + 1
		);
	};

	const goToPrevSection = () => {
		setCurrentSectionIndex((prev) => (prev === 0 ? prev : prev - 1));
	};

	// Calculate progress percentage
	const progressPercentage =
		((currentSectionIndex + 1) / sections.length) * 100;

	return (
		<div className="max-w-7xl mx-auto p-2 relative">
			{/* View toggle
			<ToggleReportView
				showFullReport={showFullReport}
				setShowFullReport={setShowFullReport}
			/> */}

			{showFullReport ? (
				/* Full Report View */
				<Card className="mb-6">
					<CardContent className="pt-6">
						<h1 className="text-3xl font-bold mb-6">
							{report.title}
						</h1>
						<div className="space-y-8">
							{sections.map((section, index) => (
								<div
									key={index}
									className="border-b pb-6 mb-6 last:border-b-0"
								>
									<ReportSectionDisplay
										section={section}
										references={report.references}
									/>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			) : (
				/* Section by Section View */
				<>
					{/* Progress Bar */}
					<div className="flex justify-center mb-4 gap-2">
						<Progress
							value={progressPercentage}
							className="w-full"
							indicatorColor="bg-violet-700 dark:bg-violet-300"
						/>
					</div>

					{/* Current section display */}
					<Card className="mb-6 min-h-64">
						<CardContent className="pt-6">
							{currentSectionIndex === 0 && (
								<h1 className="text-3xl font-bold mb-6">
									{report.title}
								</h1>
							)}
							<ReportSectionDisplay
								section={sections[currentSectionIndex]}
								references={report.references}
							/>
						</CardContent>
					</Card>

					{/* Navigation controls */}
					<div className="flex justify-between mt-4 items-center">
						<Button
							onClick={goToPrevSection}
							disabled={currentSectionIndex === 0}
							variant="outline"
							className="flex items-center gap-2 hover:scale-105 cursor-pointer"
						>
							<ChevronLeft size={16} />
							Previous
						</Button>

						<div className="text-sm text-gray-800 dark:text-gray-200">
							{currentSectionIndex + 1} / {sections.length}
						</div>

						<Button
							onClick={goToNextSection}
							disabled={
								currentSectionIndex === sections.length - 1
							}
							variant="outline"
							className="flex items-center gap-2 hover:scale-105 cursor-pointer"
						>
							Next
							<ChevronRight size={16} />
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
