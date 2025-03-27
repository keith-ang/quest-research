import React from "react";
import { Card } from "../ui/card";
import DeleteButton from "./DeleteButton";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ReportDetailsProps } from "@/types";

const ReportHeader = ({
	title,
	createdAt,
	status,
}: {
	title: string | null;
	createdAt: Date;
	status: "completed" | "in progress";
}) => {
	return (
		<div className="flex items-start gap-2 sm:gap-4">
			{status === "completed" ? (
				<FileText className="w-6 h-6 sm:w-8 sm:h-8 text-violet-600 mt-1 dark:text-violet-300" />
			) : (
				<Loader2 className="w-6 h-6 sm:w-8 sm:h-8 mt-1 animate-spin" />
			)}

			<div className="flex-1 min-w-0">
				<h3 className="text-base xl:text-lg font-semibold text-gray-900 dark:text-gray-200 truncate w-4/5">
					{title}
				</h3>
				<p className="text-sm text-gray-500 dark:text-gray-300">
					{formatDistanceToNow(createdAt, {
						addSuffix: true,
					})}
				</p>
			</div>
		</div>
	);
};

const StatusBadge = ({ status }: { status: string }) => {
	return (
		<span
			className={cn(
				"px-3 py-1 text-xs font-medium rounded-full capitalize",
				status === "completed"
					? "bg-green-100 text-green-800"
					: "bg-yellow-100 text-yellow-800"
			)}
		>
			{status}
		</span>
	);
};

export default function ReportCard({ report }: { report: ReportDetailsProps }) {
	return (
		<div>
			<Card className="relative h-full  border border-gray-50 shadow-gray-600 shadow-md hover:scale-105 duration-300 transition-all">
				<div className="absolute top-2 right-2">
					<DeleteButton
						reportId={report._id}
						userId={report.clerkUserId}
					/>
				</div>
				<Link
					href={`/dashboard/${report._id}`}
					className="block p-4 sm:p-6"
				>
					<div className="flex flex-col gap-3 sm:gap-4">
						<ReportHeader
							title={report.title}
							createdAt={report.createdAt}
							status={report.status}
						/>

						<p className="text-gray-600 dark:text-gray-300 line-clamp-3 text-sm sm:text-base pl-2">
							{report.rawReportContent.split("# summary")}
						</p>

						<div className="flex justify-between items-center mt-2 sm:mt-4">
							<StatusBadge status={report.status} />
						</div>
					</div>
				</Link>
			</Card>
		</div>
	);
}
