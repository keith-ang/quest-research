import ReportCard from "@/components/reports/ReportCard";
import { Button } from "@/components/ui/button";
import { getAllReportsForUser } from "@/lib/reports";
import { currentUser } from "@clerk/nextjs/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export default async function Dashboard() {
	const user = await currentUser();
	if (!user) {
		redirect("sign-in");
	}

	const userId = user?.id.toString();

	const reports = await getAllReportsForUser(userId);

	return (
		<main className="min-h-screen">
			<div className="container mx-auto flex flex-col gap-4 max-w-7xl">
				<div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-12 lg:py-24">
					<div className="flex gap-4 mb-8 justify-between">
						<div className="flex flex-col gap-2">
							<h2 className="text-4xl font-bold tracking-tight bg-linear-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-slate-300 bg-clip-text text-transparent">
								Your Reports
							</h2>
						</div>
						<div className="justify-center items-center">
							<Button className="bg-linear-to-r from-violet-500 to-violet-700 hover:from-violet-700 hover:to-violet-500 hover:scale-105 transition-all duration-300 group">
								<Link
									href="/dashboard/new"
									className="flex items-center text-white"
								>
									<Plus className="w-5 h-5 mr-2" />
									New Report
								</Link>
							</Button>
						</div>
					</div>

					{reports.length === 0 ? (
						"No reports to show"
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6 sm:px-0">
							{reports.map((report, index) => (
								<ReportCard key={index} report={report} />
							))}
						</div>
					)}
				</div>
			</div>
		</main>
	);
}
