import { getReadingTime, getReportById } from "@/lib/reports";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import React from "react";
import ReportPage from "@/components/reports/individual-report-view/ReportPage";

export default async function SingleReportPage(props: {
	params: Promise<{ id: string }>;
}) {
	const params = await props.params;
	const id = params.id;

	const user = await currentUser();
	const userId = user?.id;

	if (!userId) return redirect("/sign-in");

	const report = await getReportById(id, userId);

	if (!report) {
		notFound();
	}

	const readingTime = getReadingTime(report.rawReportContent);

	return <ReportPage report={report} readingTime={readingTime} />;
}
