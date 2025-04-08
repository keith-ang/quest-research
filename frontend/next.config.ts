import type { NextConfig } from "next";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
	/* config options here */
	allowedDevOrigins: [
		process.env.NEXT_PUBLIC_APP_URL || "localhost:3000",
		process.env.APP_DOMAIN || "",
	],
};

export default nextConfig;
