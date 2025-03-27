"use client";

import React from "react";
import { DownloadReportButton } from "./DownloadReportButton";
import ToggleReportView from "./ToggleReportView";

interface UserControlsProps {
	reportContent: string;
	title: string;
	showFullReport: boolean;
	setShowFullReport: (value: boolean) => void;
}

export default function UserControls({
	reportContent,
	title,
	showFullReport,
	setShowFullReport,
}: UserControlsProps) {
	return (
		<div className="flex justify-between items-center py-4 sm:py-6 md:mt-4">
			<DownloadReportButton reportContent={reportContent} title={title} />
			<ToggleReportView
				showFullReport={showFullReport}
				setShowFullReport={setShowFullReport}
			/>
		</div>
	);
}
