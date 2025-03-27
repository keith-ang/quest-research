import { IUserInput } from "@/types";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document, IUserInput {
	_id: mongoose.Types.ObjectId;
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		// Mongoose automatically creates _id as ObjectId if not specified,
		// but you can define it explicitly if you wish:
		// _id: {
		//   type: mongoose.Schema.Types.ObjectId,
		//   default: () => new mongoose.Types.ObjectId()
		// },
		email: {
			type: String,
			required: true,
			unique: true,
		},
		firstName: {
			type: String,
		},
		lastName: {
			type: String,
		},
		imageUrl: {
			type: String,
		},
		clerkUserId: {
			type: String,
			required: true,
			unique: true,
		},
	},
	{
		timestamps: true, // Automatically adds createdAt and updatedAt fields
	}
);

const User: Model<IUser> =
	mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
