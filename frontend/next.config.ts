import type { NextConfig } from "next";
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const nextConfig: NextConfig = {
	/* config options here */
	allowedDevOrigins: ["careful-tadpole-enabling.ngrok-free.app"],
};

export default nextConfig;
