import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
	/* config options here */
	allowedDevOrigins: [
		process.env.NEXT_PUBLIC_APP_URL || "localhost:3000",
		process.env.APP_DOMAIN || "",
	],

	async rewrites() {
		return [
			{
				source: "/ws/:path*",
				destination: "http://localhost:8000/ws/:path*",
			},
		];
	},
};

export default nextConfig;
