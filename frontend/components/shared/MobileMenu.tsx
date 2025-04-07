import React from "react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import NavLink from "./NavLink";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import DarkModeToggle from "./DarkModeToggle";

interface MobileMenuProps {
	menuOpen: boolean;
	setMenuOpen: (menuOpen: boolean) => void;
}

export default function MobileMenu({ menuOpen, setMenuOpen }: MobileMenuProps) {
	return (
		<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
			<SheetContent
				side="left"
				className="w-64 sm:hidden bg-violet-300 dark:bg-slate-900"
			>
				<SheetHeader className="flex flex-col items-start space-y-6">
					<div className="flex w-full items-center justify-between">
						<SheetTitle className="flex items-center gap-4">
							<SignedIn>
								<UserButton />
							</SignedIn>{" "}
							<SignedOut>
								<div>
									<NavLink
										href="/sign-in"
										className="border-2 border-gray-200 py-1 px-2 rounded-4xl whitespace-nowrap"
										onClick={() => setMenuOpen(false)}
									>
										Sign In
									</NavLink>
								</div>
							</SignedOut>
							<DarkModeToggle />
						</SheetTitle>
					</div>
				</SheetHeader>

				<div className="flex flex-col gap-6 py-2 px-4">
					{/* <NavLink
						href="/#features"
						className="px-1 py-2 text-lg"
						onClick={() => setMenuOpen(false)}
					>
						Features
					</NavLink>

					<NavLink
						href="/pricing"
						className="px-1 py-2 text-lg"
						onClick={() => setMenuOpen(false)}
					>
						Pricing
					</NavLink> */}

					<SignedIn>
						<NavLink
							href="/dashboard"
							className="px-1 py-2 text-lg"
							onClick={() => setMenuOpen(false)}
						>
							Dashboard
						</NavLink>
					</SignedIn>
				</div>
			</SheetContent>
		</Sheet>
	);
}
