"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { useWebSocketContext } from "@/lib/contexts/WebSocketContext";

export default function NewReportForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const isSubmittingRef = useRef(false);
	const router = useRouter();
	const {
		connect,
		status, // websocket connection status
		setPersistentReportId,
		persistentReportId,
		disconnect,
	} = useWebSocketContext();
	const toastIdRef = useRef<string | number | null>(null);

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

	// // Only connect if disconnected to prevent infinite loop
	// useEffect(() => {
	// 	if (persistentReportId && status === "disconnected") {
	// 		connect(persistentReportId);
	// 	}
	// }, [persistentReportId, connect, status]);

	// Clean up on unmount - but don't disconnect if we want to maintain connection across pages
	useEffect(() => {
		return () => {
			// Just dismiss any active toasts when navigating away
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current);
			}
		};
	}, []);

	const isFormDisabled =
		status === "connecting" ||
		status === "connected" ||
		isSubmitting ||
		isSubmittingRef.current;

	const onSubmit = async (values: IReportForm) => {
		// Prevent multiple submissions or submission during active connection
		if (isSubmittingRef.current || status !== "disconnected") return;

		// Set both the ref and state
		isSubmittingRef.current = true;
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
			// Store report ID in context for persistence across pages
			setPersistentReportId(reportId);

			// Step 2: Connect to WebSocket for this report
			connect(reportId);

			// Add a small delay to ensure WebSocket connection is established
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Step 3: Show initial toast
			toastIdRef.current = toast.info("Report creation started!", {
				description:
					"Your report is being generated in the background. You'll be notified when it's ready.",
				action: {
					label: "Go to Dashboard",
					onClick: () => {
						if (toastIdRef.current) {
							toast.dismiss(toastIdRef.current);
						}
						router.push("/dashboard");
					},
				},
				duration: Infinity,
			});

			// Step 4: Start the actual report generation process
			const generateResponse = await fetch(
				`/api/reports/generate/${reportId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(values),
				}
			);

			if (!generateResponse.ok) {
				throw new Error("Failed to start report generation");
			}

			// Note: The WebSocket will continue to provide updates even after redirect
		} catch (error) {
			// Handle errors
			if (toastIdRef.current) {
				toast.dismiss(toastIdRef.current);
			}

			toast.error(
				error instanceof Error
					? `Error: ${error.message}`
					: "Something went wrong while creating your report"
			);

			// Clean up properly - disconnect WebSocket and clear ID
			if (persistentReportId) {
				disconnect();
				setPersistentReportId(null);
			}
		} finally {
			// Reset both the ref and state
			isSubmittingRef.current = false;
			setIsSubmitting(false);
		}
	};

	// Get button text based on status
	const getButtonText = () => {
		if (isSubmitting) {
			return (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Creating Report...
				</>
			);
		} else if (status === "connected" || status === "connecting") {
			return (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Report in Progress...
				</>
			);
		} else {
			return "Create Report";
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
							disabled={isFormDisabled}
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
				<CardFooter className="flex flex-col">
					<Button
						type="submit"
						className="w-full bg-violet-600 hover:bg-violet-700 text-white cursor-pointer"
						disabled={isFormDisabled || form.formState.isSubmitting}
					>
						{getButtonText()}
					</Button>

					{status === "connected" && (
						<p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
							Report generation in progress. You can navigate away
							from this page.
						</p>
					)}
				</CardFooter>
			</form>
		</Card>
	);
}
