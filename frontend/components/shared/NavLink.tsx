import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

export default function NavLink({
	href,
	children,
	className,
	onClick,
}: {
	href: string;
	children: React.ReactNode;
	className?: string;
	onClick?: () => void;
}) {
	return (
		<Link
			className={cn(
				"transition-colors text-sm duration-200 text-gray-800 dark:text-gray-200 md:text-lg hover:text-violet-600 dark:hover:text-violet-600",
				className
			)}
			href={href}
			onClick={onClick}
		>
			{children}
		</Link>
	);
}
