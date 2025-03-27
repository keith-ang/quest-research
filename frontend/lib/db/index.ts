import mongoose from "mongoose";

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async (
	MONGODB_URI = process.env.MONGODB_URI
) => {
	if (cached.conn) return cached.conn;

	if (!MONGODB_URI) throw new Error("MONGODB_URI is missing");

	cached.promise = cached.promise || mongoose.connect(MONGODB_URI);

	cached.conn = await cached.promise;

	return cached.conn;
};

export function clearModelCache() {
	// Only use this in development or when you're sure you need to recompile models
	if (process.env.NODE_ENV === "development") {
		Object.keys(mongoose.models).forEach((modelName) => {
			delete mongoose.models[modelName];
		});
		console.log("Mongoose model cache cleared");
	}
}
