"use client";

import { getHost } from "@/utils/getHost";
import { useEffect, useRef, useState, useCallback } from "react";

type WebSocketStatus = "connecting" | "connected" | "disconnected" | "error";
type ReportStatus = "not_started" | "in_progress" | "completed" | "error";

interface WebSocketMessage {
	event: string;
	report_id: string;
	message: string;
	// eslint-disable-next-line  @typescript-eslint/no-explicit-any
	data?: any;
	chunk_type?: string;
	chunk_index?: number;
	total_chunks?: number | { [key: string]: number };
	should_delete?: boolean;
}

interface UseWebSocketReturn {
	status: WebSocketStatus;
	reportStatus: ReportStatus;
	lastMessage: WebSocketMessage | null;
	connect: (reportId: string) => void;
	disconnect: () => void;
	error: string | null;
	contentChunks: {
		raw_content: string[];
		processed_content: string[];
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		references: any | null;
	};
	isChunkingComplete: boolean;
}

export function useWebSocket(): UseWebSocketReturn {
	const [status, setStatus] = useState<WebSocketStatus>("disconnected");
	const [reportStatus, setReportStatus] =
		useState<ReportStatus>("not_started");
	const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(
		null
	);
	const [contentChunks, setContentChunks] = useState<{
		raw_content: string[];
		processed_content: string[];
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		references: any | null;
	}>({
		raw_content: [],
		processed_content: [],
		references: null,
	});
	const [isChunkingComplete, setIsChunkingComplete] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const websocketRef = useRef<WebSocket | null>(null);
	const reportIdRef = useRef<string | null>(null);
	const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const MAX_RECONNECT_ATTEMPTS = 3;

	// Function to keep WebSocket alive with ping/pong
	const startPingInterval = useCallback(() => {
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
		}

		pingIntervalRef.current = setInterval(() => {
			if (websocketRef.current?.readyState === WebSocket.OPEN) {
				websocketRef.current.send(
					JSON.stringify({
						type: "ping",
						timestamp: Date.now(),
					})
				);
			}
		}, 30000); // Send ping every 30 seconds
	}, []);

	// Connect to WebSocket
	const connect = useCallback(
		(reportId: string) => {
			// Only run WebSocket code in browser environment
			if (typeof window === "undefined") {
				console.log(
					"WebSocket connection skipped during server-side rendering"
				);
				return;
			}

			// Clear any existing timeout
			if (connectionTimeoutRef.current) {
				clearTimeout(connectionTimeoutRef.current);
			}

			// Set a timeout to detect connection issues
			connectionTimeoutRef.current = setTimeout(() => {
				if (status === "connecting") {
					setStatus("error");
					setError("WebSocket connection timed out");
					console.error("WebSocket connection timed out");

					// Try to reconnect
					if (reportIdRef.current) {
						console.log(
							"Attempting to reconnect WebSocket after timeout..."
						);
						if (
							reconnectAttemptsRef.current <
							MAX_RECONNECT_ATTEMPTS
						) {
							reconnectAttemptsRef.current += 1;
							connect(reportIdRef.current);
						} else {
							setError(
								`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`
							);
							// Let ReportCleanup handle cleanup
						}
					}
				}
			}, 10000); // 10 second timeout

			if (websocketRef.current?.readyState === WebSocket.OPEN) {
				disconnect();
			}

			reportIdRef.current = reportId;
			const fullHost = getHost();
			const protocol = fullHost.includes("https") ? "wss:" : "ws:";
			// console.log("Protocol: ", protocol);
			const cleanHost = fullHost
				.replace("http://", "")
				.replace("https://", "");
			// console.log("cleanedHost: ", cleanHost);
			const wsUrl = `${protocol}//${cleanHost}/ws/reports/${reportId}`;

			// console.log("WS URL: ", wsUrl);

			setStatus("connecting");

			// Reset chunking state when connecting
			setContentChunks({
				raw_content: [],
				processed_content: [],
				references: null,
			});
			setIsChunkingComplete(false);

			const ws = new WebSocket(wsUrl);
			websocketRef.current = ws;

			ws.onopen = () => {
				// Clear the timeout when connection succeeds
				if (connectionTimeoutRef.current) {
					clearTimeout(connectionTimeoutRef.current);
					connectionTimeoutRef.current = null;
				}
				setStatus("connected");
				setReportStatus("in_progress");
				setError(null);
				reconnectAttemptsRef.current = 0; // Reset reconnect attempts counter
				startPingInterval();
			};

			ws.onmessage = (event) => {
				try {
					const data: WebSocketMessage = JSON.parse(event.data);
					setLastMessage(data);

					// Handle specific events
					switch (data.event) {
						case "connected":
							setStatus("connected");
							break;

						case "completion_chunks_started":
							// Initialize arrays to hold chunks
							if (typeof data.total_chunks === "object") {
								const totalRawChunks =
									data.total_chunks.raw_content || 0;
								const totalProcessedChunks =
									data.total_chunks.processed_content || 0;

								setContentChunks({
									raw_content: new Array(totalRawChunks).fill(
										""
									),
									processed_content: new Array(
										totalProcessedChunks
									).fill(""),
									references: null,
								});
							}
							break;

						case "completion_chunk":
							const {
								chunk_type,
								chunk_index,
								data: chunkData,
							} = data;

							if (chunk_type && typeof chunk_index === "number") {
								if (
									chunk_type === "raw_content" ||
									chunk_type === "processed_content"
								) {
									setContentChunks((prev) => {
										const newChunks = [...prev[chunk_type]];
										newChunks[chunk_index] = chunkData;
										return {
											...prev,
											[chunk_type]: newChunks,
										};
									});
								} else if (chunk_type === "references") {
									setContentChunks((prev) => ({
										...prev,
										references: chunkData,
									}));
								}
							}
							break;

						case "completion_chunks_finished":
							setIsChunkingComplete(true);
							setReportStatus("completed");
							break;

						case "completed":
							// Handle legacy non-chunked completion
							setReportStatus("completed");
							break;

						case "error":
							setReportStatus("error");
							setError(data.message);
							// Removed deletion logic - let ReportCleanup handle it
							break;

						default:
							// Other events like processing_started, research_started, etc.
							setReportStatus("in_progress");
					}
				} catch (err) {
					console.error("Error parsing WebSocket message:", err);
				}
			};

			ws.onerror = (event) => {
				setStatus("error");
				// Provide more detailed error information if possible
				let errorMessage = "WebSocket connection error";
				if (event instanceof ErrorEvent && event.message) {
					errorMessage += `: ${event.message}`;
				}
				setError(errorMessage);
				console.error("WebSocket error:", event);
			};

			ws.onclose = () => {
				setStatus("disconnected");

				// Clear ping interval
				if (pingIntervalRef.current) {
					clearInterval(pingIntervalRef.current);
					pingIntervalRef.current = null;
				}

				// Try to reconnect if we still have a report ID and status is in_progress
				if (reportIdRef.current && reportStatus === "in_progress") {
					if (reconnectTimeoutRef.current) {
						clearTimeout(reconnectTimeoutRef.current);
					}

					reconnectTimeoutRef.current = setTimeout(() => {
						if (reportIdRef.current) {
							if (
								reconnectAttemptsRef.current <
								MAX_RECONNECT_ATTEMPTS
							) {
								reconnectAttemptsRef.current += 1;
								console.log(
									`Reconnection attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`
								);
								connect(reportIdRef.current);
							} else {
								setError(
									`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`
								);
								// Let ReportCleanup handle cleanup
							}
						}
					}, 3000); // Reconnect after 3 seconds
				}
			};
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[reportStatus, startPingInterval]
	);

	// Disconnect WebSocket
	const disconnect = useCallback(() => {
		if (connectionTimeoutRef.current) {
			clearTimeout(connectionTimeoutRef.current);
			connectionTimeoutRef.current = null;
		}
		if (websocketRef.current) {
			websocketRef.current.close();
			websocketRef.current = null;
		}

		// Clear intervals and timeouts
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}

		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		reconnectAttemptsRef.current = 0;
		reportIdRef.current = null;
		setStatus("disconnected");
	}, []);

	// Add safety check for reports that have been in progress for too long
	useEffect(() => {
		let timeoutId: NodeJS.Timeout | null = null;

		if (reportStatus === "in_progress" && reportIdRef.current) {
			// Set a timeout to signal when a report has been processing too long
			timeoutId = setTimeout(
				() => {
					console.log("Report has been processing for too long");

					// Just update the status to signal the timeout
					// Let ReportCleanup handle the actual cleanup
					setError("Report generation timed out. Please try again.");
					setReportStatus("error");
				},
				10 * 60 * 1000
			); // 10 minutes timeout
		}

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [reportStatus]);

	// Clean up on component unmount
	useEffect(() => {
		return () => {
			disconnect();
		};
	}, [disconnect]);

	// Automatically disconnect when report is completed
	useEffect(() => {
		if (reportStatus === "completed" && status === "connected") {
			console.log("Report completed, disconnecting WebSocket");
			// Add a short delay to ensure any final messages are processed
			const disconnectTimer = setTimeout(() => {
				disconnect();
			}, 2000);

			return () => clearTimeout(disconnectTimer);
		}
	}, [reportStatus, status, disconnect]);

	return {
		status,
		reportStatus,
		lastMessage,
		connect,
		disconnect,
		error,
		contentChunks,
		isChunkingComplete,
	};
}
