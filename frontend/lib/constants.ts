import { ReportDetailsProps } from "@/types";
import { REPORT_CONTENT } from "./sample-report";
import { REPORT_REFERENCES } from "./sample-references";

// <-- NAVBAR -->
export const APP_NAME = "QUEST";
export const APP_NAME2 = "Research";

// <-- HERO -->
export const HEADLINE = "Lorem ipsum dolor sit amet, consectetur.";
export const SUBHEADLINE =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus consectetur.";

export const reports: ReportDetailsProps[] = [
	{
		title: "Monthly Sales Report",
		userId: "blah",
		_id: "report-001",
		reportContent: REPORT_CONTENT,
		status: "completed",
		createdAt: new Date("2023-08-01T09:00:00Z"),
		updatedAt: new Date("2023-08-01T09:00:00Z"),
		references: REPORT_REFERENCES,
	},
	// {
	// 	title: "Quarterly Performance Analysis",
	// 	id: "report-002",
	// 	report_content:
	// 		"Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae.",
	// 	status: "in progress",
	// 	created_at: "2023-07-15T14:30:00Z",
	// },
	// {
	// 	title: "Annual Financial Overview",
	// 	id: "report-003",
	// 	report_content:
	// 		"Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
	// 	status: "completed",
	// 	created_at: "2023-01-20T10:15:00Z",
	// },
	// {
	// 	title: "Customer Feedback Report",
	// 	id: "report-004",
	// 	report_content:
	// 		"Sed posuere consectetur est at lobortis. Cras mattis consectetur purus sit amet fermentum.",
	// 	status: "in progress",
	// 	created_at: "2023-06-05T11:00:00Z",
	// },
	// {
	// 	title: "Market Trend Analysis",
	// 	id: "report-005",
	// 	report_content:
	// 		"Curabitur blandit tempus porttitor. Etiam porta sem malesuada magna mollis euismod.",
	// 	status: "completed",
	// 	created_at: "2023-02-28T16:00:00Z",
	// },
	// {
	// 	title: "Operational Efficiency Report",
	// 	id: "report-006",
	// 	report_content:
	// 		"Maecenas faucibus mollis interdum. Nullam id dolor id nibh ultricies vehicula ut id elit.",
	// 	status: "in progress",
	// 	created_at: "2023-05-10T08:45:00Z",
	// },
	// {
	// 	title: "Product Development Update",
	// 	id: "report-007",
	// 	report_content:
	// 		"Nulla vitae elit libero, a pharetra augue. Integer posuere erat a ante venenatis dapibus.",
	// 	status: "completed",
	// 	created_at: "2023-03-25T12:30:00Z",
	// },
	// {
	// 	title: "HR Recruitment Summary",
	// 	id: "report-008",
	// 	report_content:
	// 		"Aenean lacinia bibendum nulla sed consectetur. Fusce dapibus, tellus ac cursus commodo.",
	// 	status: "in progress",
	// 	created_at: "2023-08-10T13:20:00Z",
	// },
	// {
	// 	title: "IT Infrastructure Report",
	// 	id: "report-009",
	// 	report_content:
	// 		"Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.",
	// 	status: "completed",
	// 	created_at: "2023-04-01T07:15:00Z",
	// },
	// {
	// 	title: "Environmental Impact Study",
	// 	id: "report-010",
	// 	report_content:
	// 		"Donec ullamcorper nulla non metus auctor fringilla. Nulla vitae elit libero, a pharetra augue.",
	// 	status: "in progress",
	// 	created_at: "2023-07-01T15:45:00Z",
	// },
];
