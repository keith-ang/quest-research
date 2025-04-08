import { Menu } from "lucide-react";
import React from "react";
import NavLink from "./NavLink";
import { APP_NAME, APP_NAME2 } from "@/lib/constants";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import DarkModeToggle from "./DarkModeToggle";

interface MenuOpenProps {
	setMenuOpen: (menuOpen: boolean) => void;
}

export default function Navbar({ setMenuOpen }: MenuOpenProps) {
	return (
		<div className="w-full shadow-md shadow-gray-40 dark:shadow-gray-700 backdrop-blur-3xl">
			<nav className="container flex items-center justify-between py-4 px-4 md:px-10 mx-auto max-w-7xl">
				<div className="flex md:flex-1">
					<NavLink
						className="flex items-center justify-center gap-2 lg:gap-2 shrink-0 "
						href="/"
					>
						<Image
							src="/images/quest-logo.png"
							height={40}
							width={40}
							alt="logo"
						/>
						<h1 className=" text-lg md:text-2xl font-semibold flex flex-col leading-4 md:leading-6">
							{APP_NAME}
							<span>{APP_NAME2}</span>
						</h1>
					</NavLink>
				</div>
				<div className="flex sm:justify-end sm:flex-1 ">
					<div className="relative z-40 sm:hidden ">
						<Button
							className="w-8 h-8 bg-transparent cursor-pointer border border-gray-300"
							variant="ghost"
							size="icon"
							onClick={() => setMenuOpen(true)}
						>
							<Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
						</Button>
					</div>
					<div className="hidden sm:flex gap-4 md:gap-6 lg:gap-10 justify-center items-center">
						{/* <NavLink href="/#features">Features</NavLink>
						<NavLink href="/#pricing">Pricing</NavLink> */}
						<SignedIn>
							<NavLink href="/dashboard">Dashboard</NavLink>
						</SignedIn>
						<DarkModeToggle />
						<SignedIn>
							<UserButton />
						</SignedIn>{" "}
						<SignedOut>
							{/* <div className="">
								<NavLink
									href="/sign-in"
									className="border-2 border-gray-200 py-1 px-1 sm:px-2 rounded-4xl"
								>
									Sign In
								</NavLink>
							</div> */}
							<SignInButton
								mode="modal"
								fallbackRedirectUrl={"/dashboard"}
								forceRedirectUrl={"/dashboard"}
							>
								<Button
									className="group inline-flex rounded-3xl w-20 lg:w-28 cursor-pointer justify-center items-center bg-gradient-to-r from-violet-800 to-violet-500 hover:from-violet-500 hover:to-violet-800
						dark:from-gray-200 dark:to-gray-100 dark:hover:from-gray-300 dark:hover:to-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl leading-relaxed"
								>
									Sign In
								</Button>
							</SignInButton>
						</SignedOut>
					</div>
				</div>
			</nav>
		</div>
	);
}
