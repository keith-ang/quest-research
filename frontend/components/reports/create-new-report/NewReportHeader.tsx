import React from "react";
import { Badge } from "../../ui/badge";
import { Sparkles } from "lucide-react";

export default function NewReportHeader() {
	return (
		<div className="flex flex-col items-center justify-center gap-6 text-center">
			<div className="relative p-[1px] overflow-hidden rounded-full bg-linear-to-r from-violet-400 to-violet-800 animate-gradient-x group">
				<Badge
					variant={"secondary"}
					className="relative px-6 py-2 text-violet-800 font-medium bg-gray-100 dark:bg-violet-500/30 rounded-full"
				>
					<Sparkles
						className="h-10 w-10 mr-2 text-violet-900 dark:text-gray-200 animate-pulse"
						style={{ height: 15, width: 15 }}
					/>
					<span className="text-violet-500 dark:text-gray-200">
						AI-powered Report Creation
					</span>
				</Badge>
			</div>
			<div className="capitalize text-3xl tracking-tight text-gray-700 dark:text-gray-200 sm:text-4xl font-bold ">
				Create Your AI-powered{" "}
				<span className="relative inline-block">
					<span className="relative z-10 px-2 text-violet-600">
						Report
					</span>
					<span
						className="absolute inset-0 bg-violet-200/90 -rotate-2 rounded-lg transform -skew-y-1"
						aria-hidden="true"
					></span>
				</span>{" "}
			</div>
		</div>
	);
}
