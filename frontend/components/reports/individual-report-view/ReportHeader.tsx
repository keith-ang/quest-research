import Link from "next/link";
import { Button } from "../../ui/button";
import { Calendar, ChevronLeft, Clock } from "lucide-react";

export default function ReportHeader({
	title,
	createdAt,
	readingTime,
}: {
	title: string;
	createdAt: Date;
	readingTime: number;
}) {
	return (
		<div className="flex gap-4 justify-between items-center ">
			<div className="space-y-6">
				<div className="flex flex-wrap items-center gap-4">
					<div className="self-start">
						<Link href="/dashboard">
							<Button
								variant={"link"}
								className="group flex items-center gap-1 sm:gap-2 bg-violet-100 hover:bg-violet-200  dark:bg-violet-600 dark:hover:bg-violet-500 backdrop-blur-xs rounded-full transition-all duration-200 shadow-xs hover:shadow-md border border-violet-100/30  px-2 sm:px-3 hover:no-underline hover:translate-x-0.5 cursor-pointer"
							>
								<ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-violet-700 dark:text-gray-200 transition-transform " />
								<span className="text-xs sm:text-sm text-violet-800 dark:text-gray-200 font-medium">
									Back{" "}
									<span className="hidden md:inline text-violet-800 dark:text-gray-200 ">
										to Dashboard
									</span>
								</span>
							</Button>
						</Link>
					</div>
					{/* <Badge
						variant="secondary"
						className="relative px-4 py-1.5 text-sm font-medium bg-violet-100 backdrop-blur-xs rounded-full hover:bg-white/90 transition-all duration-200 shadow-xs hover:shadow-md text-violet-700 dark:bg-violet-600 dark:text-gray-200"
					>
						<Sparkles
							className="h-4 w-4 mr-1.2 text-violet-700 dark:text-gray-200"
							style={{ height: 20, width: 20 }}
						/>
						AI Report
					</Badge> */}
					<div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
						<Calendar className="h-4 w-4 text-violet-600 " />
						{new Date(createdAt).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
						<Clock className="h-4 w-4 text-violet-500" />
						{readingTime} min read
					</div>
				</div>{" "}
				<h1 className="text-3xl md:text-4xl lg:text-5xl font-bold lg:tracking-tight">
					<span className="bg-linear-to-r from-violet-600 to bg-violet-800 dark:from-violet-200 to-violet-400 bg-clip-text text-transparent">
						{title}
					</span>
				</h1>
			</div>
		</div>
	);
}
