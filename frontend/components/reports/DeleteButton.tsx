"use client";

import React, { useState, useTransition } from "react";
import { Button } from "../ui/button";
import { Trash2 } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteReportById } from "@/lib/actions/reports.actions";

interface DeleteButtonProps {
	reportId: string;
	userId: string;
}

export default function DeleteButton({ reportId, userId }: DeleteButtonProps) {
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		startTransition(async () => {
			const result = await deleteReportById(reportId, userId);

			if (!result.success) {
				toast.error("Error", {
					description: "Failed to delete summary",
				});
			}

			if (result.success) {
				toast.success("Report deleted successfully!");
			}

			setOpen(false);
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant={"ghost"}
					size="icon"
					className="text-gray-400 bg-gray-50 border border-gray-200 hover:text-rose-600 hover:bg-gray-50 cursor-pointer dark:bg-gray-800 dark:text-white dark:hover:text-rose-600"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Report</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete this report? This action
						cannot be undone.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant={"ghost"}
						className=" bg-gray-50 border border-gray-200 hover:text-gray-600 hover:bg-gray-100 cursor-pointer dark:bg-slate-700 dark:text-gray-300"
						onClick={() => setOpen(false)}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						className=" bg-rose-500 border border-gray-200 text-white hover:text-gray-100 hover:bg-rose-700 dark:hover:bg-rose-700 cursor-pointer"
						onClick={() => handleDelete()}
					>
						{isPending ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
