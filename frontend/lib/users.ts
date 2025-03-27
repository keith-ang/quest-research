import { IUserInput } from "@/types";
import { connectToDatabase } from "./db";
import User, { IUser } from "@/lib/db/models/user.model";

export async function createUser(userData: IUserInput): Promise<IUser> {
	try {
		await connectToDatabase();
		const newUser = await User.create(userData);
		return newUser;
	} catch (error) {
		console.error("Error creating user:", error);
		throw error;
	}
}

export async function getUserById({
	id,
	clerkUserId,
}: {
	id?: string;
	clerkUserId?: string;
}): Promise<IUser | null> {
	try {
		if (!id && !clerkUserId) {
			throw new Error("Either id or clerkUserId is required");
		}

		await connectToDatabase();

		let user: IUser | null = null;

		// Search by _id if provided, otherwise use clerkUserId
		if (id) {
			user = await User.findById(id);
		} else if (clerkUserId) {
			user = await User.findOne({ clerkUserId });
		}

		return user;
	} catch (error) {
		console.error("Error getting user by ID:", error);
		throw error;
	}
}

export async function updateUser(
	clerkUserId: string,
	updateData: Partial<IUser>
): Promise<IUser | null> {
	try {
		await connectToDatabase();
		const updatedUser = await User.findOneAndUpdate(
			{ clerkUserId: clerkUserId },
			updateData,
			{ new: true } // returns the updated document
		);

		return updatedUser;
	} catch (error) {
		console.error("Error updating user:", error);
		throw error;
	}
}

export async function deleteUser(clerkUserId: string): Promise<IUser | null> {
	try {
		await connectToDatabase();
		const deletedUser = await User.findOneAndDelete({ clerkUserId });
		return deletedUser;
	} catch (error) {
		console.error("Error deleting user:", error);
		throw error;
	}
}
