"use client";

import ReportDisplay from "@/components/reports/individual-report-view/ReportDisplay";
import ReportHeader from "@/components/reports/individual-report-view/ReportHeader";
import UserControls from "@/components/reports/individual-report-view/UserControls";
import { ReportDetailsProps } from "@/types";
import React, { useState } from "react";

interface ReportPageProps {
	report: ReportDetailsProps;
	readingTime: number;
}

export default function ReportPage({ report, readingTime }: ReportPageProps) {
	// State for view mode (true = full report, false = section by section)
	const [showFullReport, setShowFullReport] = useState(true);

	return (
		<div className="min-h-screen">
			<div className="container mx-auto flex flex-col gap-4 max-w-7xl">
				<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-24">
					{/* Report header with title and metadata */}
					<ReportHeader
						title={report.title}
						createdAt={report.createdAt}
						readingTime={readingTime}
					/>

					{/* User controls positioned between header and report display */}
					<UserControls
						reportContent={report.processedReportContent}
						title={report.title}
						showFullReport={showFullReport}
						setShowFullReport={setShowFullReport}
					/>

					{/* Report content display */}
					<ReportDisplay
						report={report}
						showFullReport={showFullReport}
					/>
				</div>
			</div>
		</div>
	);
}
