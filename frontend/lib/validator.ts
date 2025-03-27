import * as z from "zod";

export const reportFormSchema = z.object({
	topic: z.string().min(3, {
		message: "Topic must be at least 3 characters.",
	}),
	do_research: z.boolean().default(true),
	do_generate_outline: z.boolean().default(true),
	do_generate_article: z.boolean().default(true),
	do_polish_article: z.boolean().default(true),
});
