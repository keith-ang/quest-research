import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createUser, deleteUser, getUserById, updateUser } from "@/lib/users";
import { IUser } from "@/lib/db/models/user.model";
import { IUserInput } from "@/types";

export async function POST(req: Request) {
	const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

	if (!CLERK_WEBHOOK_SECRET) {
		throw new Error(
			"Error: Please add SIGNING_SECRET from Clerk Dashboard to .env or .env"
		);
	}

	// Create new Svix instance with secret
	const wh = new Webhook(CLERK_WEBHOOK_SECRET);

	// Get headers
	const headerPayload = await headers();
	const svix_id = headerPayload.get("svix-id");
	const svix_timestamp = headerPayload.get("svix-timestamp");
	const svix_signature = headerPayload.get("svix-signature");

	// If there are no headers, error out
	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response("Error: Missing Svix headers", {
			status: 400,
		});
	}

	// Get body
	const payload = await req.json();
	const body = JSON.stringify(payload);

	let evt: WebhookEvent;

	// Verify payload with headers
	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error("Error: Could not verify webhook:", err);
		return new Response("Error: Verification error", {
			status: 400,
		});
	}

	// Do something with payload
	// For this guide, log payload to console
	const eventType = evt.type;
	// console.log(
	// 	`Received webhook with ID ${id} and event type of ${eventType}`
	// );
	// console.log("Webhook payload:", body);

	switch (eventType) {
		case "user.created":
			const { id, email_addresses, first_name, last_name, image_url } =
				evt.data;

			if (!id || !email_addresses) {
				return new Response("Error occurred -- missing data", {
					status: 400,
				});
			}

			const user: IUserInput = {
				clerkUserId: id,
				email: email_addresses[0].email_address,
				...(first_name ? { firstName: first_name } : {}),
				...(last_name ? { lastName: last_name } : {}),
				...(image_url ? { imageUrl: image_url } : {}),
			};

			await createUser(user);
			break;

		case "user.updated": {
			const { id, email_addresses, first_name, last_name, image_url } =
				evt.data;

			if (!id || !email_addresses) {
				return new Response("Error: Missing user data for update", {
					status: 400,
				});
			}

			// Locate the existing user using clerkUserId
			const existingUser = await getUserById({ clerkUserId: id });
			if (!existingUser) {
				return new Response("Error: User not found", {
					status: 400,
				});
			}

			const updateData = {
				email: email_addresses[0].email_address,
				...(first_name ? { firstName: first_name } : {}),
				...(last_name ? { lastName: last_name } : {}),
				...(image_url ? { imageUrl: image_url } : {}),
			};

			await updateUser(existingUser.clerkUserId, updateData);

			break;
		}

		case "user.deleted": {
			const { id } = evt.data;

			if (!id) {
				return new Response("Error: Missing user id for deletion", {
					status: 400,
				});
			}

			// Find the user by clerkUserId before deleting
			const userToDelete = await getUserById({ clerkUserId: id });
			if (userToDelete) {
				await deleteUser(userToDelete.clerkUserId);
			} else {
				console.log("User not found for deletion.");
			}
			break;
		}

		default:
			// Optionally log or handle other event types
			console.log(`Unhandled event type: ${evt.type}`);
			break;
	}

	return new Response("Webhook received", { status: 200 });
}
