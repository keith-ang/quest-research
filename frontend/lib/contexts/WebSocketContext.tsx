// context/WebSocketContext.tsx
"use client";

import React, {
	createContext,
	useContext,
	ReactNode,
	useState,
	useEffect,
} from "react";
import { useWebSocket } from "@/lib/hooks/useWebSocket";

type WebSocketContextType = ReturnType<typeof useWebSocket> & {
	persistentReportId: string | null;
	setPersistentReportId: (id: string | null) => void;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
	undefined
);

export function WebSocketProvider({ children }: { children: ReactNode }) {
	const webSocketState = useWebSocket();
	const [persistentReportId, setPersistentReportId] = useState<string | null>(
		null
	);

	// Store report ID in localStorage for persistence across page navigations
	useEffect(() => {
		// When component mounts, check localStorage
		const storedReportId = localStorage.getItem("currentReportId");
		if (storedReportId) {
			setPersistentReportId(storedReportId);
		}

		// Listen for storage events from other tabs
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "currentReportId") {
				setPersistentReportId(e.newValue);
			}
		};

		window.addEventListener("storage", handleStorageChange);
		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, []);

	return (
		<WebSocketContext.Provider
			value={{
				...webSocketState,
				persistentReportId,
				setPersistentReportId: (id) => {
					setPersistentReportId(id);
					if (id) {
						localStorage.setItem("currentReportId", id);
					} else {
						localStorage.removeItem("currentReportId");
					}
				},
			}}
		>
			{children}
		</WebSocketContext.Provider>
	);
}

export function useWebSocketContext() {
	const context = useContext(WebSocketContext);
	if (context === undefined) {
		throw new Error(
			"useWebSocketContext must be used within a WebSocketProvider"
		);
	}
	return context;
}
