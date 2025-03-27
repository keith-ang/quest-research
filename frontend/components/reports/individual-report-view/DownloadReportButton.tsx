"use client";
import { DownloadIcon } from "lucide-react";
import { Button } from "../../ui/button";

export function DownloadReportButton({
	title,
	reportContent,
}: {
	title: string;
	reportContent: string;
}) {
	const handleDownload = () => {
		const blob = new Blob([reportContent], { type: "text/plain" });
		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = `Summary-${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
		document.body.appendChild(link);
		link.click();

		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	};

	return (
		<Button
			className="h-8 px-3 bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-600 dark:hover:bg-violet-500 dark:text-gray-100 hover:-translate-y-0.5 cursor-pointer"
			onClick={handleDownload}
		>
			<DownloadIcon className="h-4 w-4" />
			<span className="text-xs sm:text-sm text-violet-800 dark:text-gray-200 font-medium">
				Download{" "}
				<span className="hidden md:inline text-violet-800 dark:text-gray-200 ">
					Report
				</span>
			</span>
		</Button>
	);
}
