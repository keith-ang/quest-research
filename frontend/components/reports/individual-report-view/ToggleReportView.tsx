import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React from "react";

// Define the props interface for the component
interface ToggleReportViewProps {
	showFullReport: boolean;
	setShowFullReport: (value: boolean) => void;
}

export default function ToggleReportView({
	showFullReport,
	setShowFullReport,
}: ToggleReportViewProps) {
	return (
		<div className="flex justify-end items-center gap-2">
			<Label
				htmlFor="view-mode"
				className="text-sm text-gray-600 dark:text-gray-300"
			>
				Section View
			</Label>
			<Switch
				id="view-mode"
				checked={showFullReport}
				onCheckedChange={setShowFullReport}
			/>
			<Label
				htmlFor="view-mode"
				className="text-sm text-gray-600 dark:text-gray-300"
			>
				Full Report
			</Label>
		</div>
	);
}
