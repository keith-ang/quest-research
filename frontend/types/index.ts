import { z } from "zod";
import { reportFormSchema } from "@/lib/validator";

// <-- USERS -->

export type IUserInput = {
	email: string;
	firstName?: string;
	lastName?: string;
	imageUrl?: string;
	clerkUserId: string;
};

// <-- REPORTS -->

export type IReportForm = z.infer<typeof reportFormSchema>;

export interface ReportDetailsProps {
	_id: string;
	clerkUserId: string;
	title: string;
	rawReportContent: string;
	processedReportContent: string;
	status: "completed" | "in progress";
	createdAt: Date;
	updatedAt: Date;
	references: ReportReferences;
}

export interface InfoMeta {
	query: string;
}

export interface UrlInfo {
	url: string;
	description: string;
	snippets: string[];
	title: string;
	meta: InfoMeta;
	citation_uuid: number;
}

export interface UrlToUnifiedIndex {
	[url: string]: number;
}

export interface UrlToInfo {
	[url: string]: UrlInfo;
}

export interface ReportReferences {
	url_to_unified_index: UrlToUnifiedIndex;
	url_to_info: UrlToInfo;
}

export interface ReportSection {
	title: string;
	content: string;
	level?: number; // 1 for h1, 2 for h2, etc.
	parentTitle?: string; // For sub-headings, stores the parent heading title
}

export interface ReportSectionDisplayProps {
	section: ReportSection;
	references: ReportReferences;
}
