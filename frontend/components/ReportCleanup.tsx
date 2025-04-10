// components/ReportCleanup.tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useWebSocketContext } from "@/lib/contexts/WebSocketContext";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
	deletePlaceholderReport,
	updateReportWithWebSocketData,
} from "@/utils/reports";

export function ReportCleanup() {
	const {
		persistentReportId,
		setPersistentReportId,
		contentChunks,
		isChunkingComplete,
		disconnect,
		status,
		lastMessage,
	} = useWebSocketContext();
	const router = useRouter();
	const cleanupAttemptedRef = useRef(false);
	const deletionAttemptedRef = useRef<Set<string>>(new Set());
	const updatePerformedRef = useRef(false);
	const redirectPerformedRef = useRef(false);

	// Consolidated cleanup function
	const performCleanup = useCallback(() => {
		if (cleanupAttemptedRef.current || !persistentReportId) return;

		cleanupAttemptedRef.current = true;
		console.log(
			"Performing comprehensive cleanup for report:",
			persistentReportId
		);

		// Disconnect WebSocket
		disconnect();

		// Clear persistent report ID
		setPersistentReportId(null);

		console.log("Cleaned up connections and report ID");
	}, [persistentReportId, disconnect, setPersistentReportId]);

	// Handle successful report completion - with guard to prevent multiple executions
	useEffect(() => {
		if (
			isChunkingComplete &&
			contentChunks &&
			persistentReportId &&
			!updatePerformedRef.current
		) {
			// Mark this update as performed so we don't do it again
			updatePerformedRef.current = true;

			console.log("Globally updating report with completed chunks");
			const rawContent = contentChunks.raw_content.join("");
			const processedContent = contentChunks.processed_content.join("");
			const references = contentChunks.references;

			updateReportWithWebSocketData(persistentReportId, {
				raw_content: rawContent,
				processed_content: processedContent,
				references: references,
			});

			toast.success("Report completed! Redirecting to your report...", {
				duration: 3000,
			});

			// Redirect and cleanup workflow (only if not already redirected)
			if (!redirectPerformedRef.current) {
				redirectPerformedRef.current = true;

				const redirectTimer = setTimeout(() => {
					router.push(`/dashboard/${persistentReportId}`);

					// Delayed cleanup
					const cleanupTimer = setTimeout(() => {
						performCleanup();
					}, 10000);

					return () => {
						clearTimeout(redirectTimer);
						clearTimeout(cleanupTimer);
					};
				}, 1500);
			}
		}
	}, [
		isChunkingComplete,
		contentChunks,
		persistentReportId,
		router,
		performCleanup,
	]);

	// Handle error-based deletion - with guard to prevent multiple executions
	useEffect(() => {
		if (
			lastMessage?.event === "error" &&
			lastMessage.should_delete === true &&
			persistentReportId &&
			!deletionAttemptedRef.current.has(persistentReportId)
		) {
			console.log(
				"Received should_delete flag for report:",
				persistentReportId
			);

			// Mark this report as having a deletion attempt
			deletionAttemptedRef.current.add(persistentReportId);

			// Enhanced error handling
			const errorMessage = lastMessage.message || "Unknown error";
			const errorType = getErrorType(errorMessage);

			// Show error toast
			toast.error(`${errorType}: Report generation failed`, {
				description: errorMessage,
				duration: Infinity,
				action: {
					label: "Dismiss",
					onClick: () => {},
				},
			});

			// Delete report and cleanup
			deletePlaceholderReport(persistentReportId)
				.then(() => {
					performCleanup();
					// Only redirect once
					if (!redirectPerformedRef.current) {
						redirectPerformedRef.current = true;
						router.push("/dashboard");
					}
				})
				.catch((err) => {
					console.error("Failed to delete report:", err);
					performCleanup();
				});
		}
	}, [lastMessage, persistentReportId, performCleanup, router]);

	// Simplified connection status monitoring
	useEffect(() => {
		if (
			status === "disconnected" &&
			persistentReportId &&
			!cleanupAttemptedRef.current
		) {
			console.log("WebSocket disconnected, initiating cleanup");
			const timer = setTimeout(performCleanup, 5000);
			return () => clearTimeout(timer);
		}
	}, [status, persistentReportId, performCleanup]);

	return null;
}

// Helper function to determine error type
function getErrorType(errorMessage: string): string {
	if (errorMessage.includes("API error during STORM processing"))
		return "API Error";
	if (errorMessage.includes("timeout")) return "Timeout Error";
	if (errorMessage.includes("OpenAI API error")) return "OpenAI API Error";
	return "Error";
}
