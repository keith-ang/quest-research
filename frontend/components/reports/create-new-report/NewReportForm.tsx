"use client";

import React, { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Textarea } from "../../ui/textarea";
import { reportFormSchema } from "@/lib/validator";
import { IReportForm } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewReportForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	const form = useForm({
		resolver: zodResolver(reportFormSchema),
		defaultValues: {
			topic: "",
			do_research: true,
			do_generate_outline: true,
			do_generate_article: true,
			do_polish_article: true,
		},
	});

	const onSubmit = async (values: IReportForm) => {
		setIsSubmitting(true);

		try {
			// Step 1: Create a placeholder report with "in progress" status
			const initialResponse = await fetch("/api/reports/placeholder", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					topic: values.topic,
					status: "in progress",
				}),
			});

			if (!initialResponse.ok) {
				throw new Error("Failed to initialize report");
			}

			const initialData = await initialResponse.json();
			const reportId = initialData.reportId;

			// Step 2: Redirect user to dashboard to see the "in progress" report
			const toastId = toast.info("Report creation started!", {
				description:
					"Your report is being generated in the background. You'll be notified when it's ready.",
				action: {
					label: "Go to Dashboard",
					onClick: () => {
						toast.dismiss(toastId);
						router.push("/dashboard");
					},
				},
				duration: Infinity,
			});

			// Step 3: Start the actual report generation process in the background
			const generateFullReport = async () => {
				try {
					const response = await fetch(
						`/api/reports/generate/${reportId}`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(values),
						}
					);

					if (!response.ok) {
						throw new Error("Report generation failed");
					}

					const data = await response.json();

					toast.dismiss(toastId);

					// Step 3:
					// Create a new persistent toast that remains visible on the report page
					const successToastId = toast.success("Report Ready!", {
						description:
							"Your report has been successfully generated.",
						action: {
							label: "Dismiss",
							onClick: () => toast.dismiss(successToastId),
						},
						duration: Infinity, // Toast will stay until user dismisses it
					});

					router.push(`/dashboard/${reportId}`);

					return data;
				} catch (error) {
					toast.dismiss(toastId);
					// Step 4: Handle failure - delete the placeholder and show error
					await fetch(`/api/reports/${reportId}`, {
						method: "DELETE",
					});

					toast.error(
						`Failed to generate report: ${
							error instanceof Error
								? error.message
								: "Unknown error"
						}`,
						{ duration: 5000 }
					);

					throw error; // Re-throw to handle in the outer catch if needed
				}
			};

			// Start the generation process without awaiting it
			// This allows it to run in the background after redirect
			generateFullReport().catch((error) => {
				console.error("Background report generation failed:", error);
			});
		} catch (error) {
			// Handle initial creation errors
			toast.error(
				error instanceof Error
					? `Error: ${error.message}`
					: "Something went wrong while creating your report"
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Card className="w-full max-w-4xl shadow-lg px-6 py-12 border-2 border-violet-200">
			<CardHeader>
				<CardTitle className="text-xl text-gray-800 dark:text-gray-100">
					New Report Details
				</CardTitle>
				<CardDescription className="text-gray-600 dark:text-gray-300">
					Configure your AI-powered report generation settings
				</CardDescription>
			</CardHeader>
			<form className="space-y-12" onSubmit={form.handleSubmit(onSubmit)}>
				<CardContent className="space-y-6">
					<div className="space-y-4">
						<Label
							htmlFor="topic"
							className="text-gray-700 dark:text-gray-200"
						>
							Report Topic
						</Label>
						<Textarea
							id="topic"
							placeholder="Enter a detailed topic for your report..."
							className="focus-visible:ring-violet-500 min-h-[100px]" // Added min-height
							{...form.register("topic")}
						/>
						{form.formState.errors.topic && (
							<p className="text-sm text-red-500">
								{form.formState.errors.topic.message}
							</p>
						)}
					</div>

					<div className="space-y-4 pt-2">
						<h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">
							AI Processing Options
						</h3>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label
									htmlFor="do_research"
									className="text-gray-700 dark:text-gray-200"
								>
									Perform Research
								</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									AI will gather information on your topic
								</p>
							</div>
							<Switch
								disabled
								id="do_research"
								checked={form.watch("do_research")}
								onCheckedChange={(checked) =>
									form.setValue("do_research", checked)
								}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label
									htmlFor="do_generate_outline"
									className="text-gray-700 dark:text-gray-200"
								>
									Generate Outline
								</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									AI will create a structured outline
								</p>
							</div>
							<Switch
								disabled
								id="do_generate_outline"
								checked={form.watch("do_generate_outline")}
								onCheckedChange={(checked) =>
									form.setValue(
										"do_generate_outline",
										checked
									)
								}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label
									htmlFor="do_generate_article"
									className="text-gray-700 dark:text-gray-200"
								>
									Generate Full Article
								</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									AI will write complete report content
								</p>
							</div>
							<Switch
								disabled
								id="do_generate_article"
								checked={form.watch("do_generate_article")}
								onCheckedChange={(checked) =>
									form.setValue(
										"do_generate_article",
										checked
									)
								}
							/>
						</div>

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label
									htmlFor="do_polish_article"
									className="text-gray-700 dark:text-gray-200"
								>
									Polish Final Content
								</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									AI will refine and improve the report
									quality
								</p>
							</div>
							<Switch
								disabled
								id="do_polish_article"
								checked={form.watch("do_polish_article")}
								onCheckedChange={(checked) =>
									form.setValue("do_polish_article", checked)
								}
							/>
						</div>
					</div>
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						className="w-full bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Creating Report...
							</>
						) : (
							"Create Report"
						)}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
