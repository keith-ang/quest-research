export const getHost = (): string => {
	if (typeof window !== "undefined") {
		return process.env.NEXT_PUBLIC_STORM_API_URL || "localhost:8000";
	}
	return "";
};
