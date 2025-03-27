import NewReportForm from "@/components/reports/create-new-report/NewReportForm";
import NewReportHeader from "@/components/reports/create-new-report/NewReportHeader";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";

export default async function NewReportPage() {
	const user = await currentUser();
	const userId = user?.id;

	if (!userId) return redirect("/sign-in");

	return (
		<section className="min-h-screen">
			<div className="mx-auto max-w-7xl px-6 py-12 sm:py-24 lg:px-8">
				<div className="flex flex-col items-center justify-center gap-12 text-center">
					<NewReportHeader />
					<NewReportForm />
				</div>
			</div>
		</section>
	);
}
