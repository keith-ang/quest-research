import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_NAME2, HEADLINE, SUBHEADLINE } from "@/lib/constants";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

const Hero = () => {
	return (
		<section
			id="#hero"
			className=" mx-auto flex flex-col items-center justify-center h-full max-w-7xl"
		>
			<div className="flex flex-col items-center justify-center px-2">
				<div className="relative p-[3px] overflow-hidden rounded-full bg-linear-to-r from-violet-500 to-violet-800 animate-gradient-x group">
					<Badge
						variant={"secondary"}
						className="relative px-2 py-2 sm:px-3 lg:px-4 text-base font-medium bg-white rounded-full group-hover:bg-gray-50 transition-colors duration-200"
					>
						<Sparkles
							className="mr-2 text-violet-600 font-extrabold animate-pulse"
							style={{ width: 20, height: 20 }}
						/>
						<p className="text-base text-violet-600 font-semibold">
							Powered by AI
						</p>
					</Badge>
				</div>

				<h1 className="text-center font-bold py-6 text-4xl md:text-5xl lg:text-6xl max-w-6xl">
					{HEADLINE}
				</h1>
				<h2 className="text-lg font-semibold sm:text-xl lg:text-2xl text-center lg:px-0 lg:max-w-5xl text-gray-500 dark:text-gray-400">
					{SUBHEADLINE}
				</h2>
				<Button
					variant="link"
					className="mt-6 sm:text-lg lg:text-xl rounded-full px-8 py-6 sm:px-10 lg:px-12 sm:py-7 lg:py-8  bg-linear-to-r from-slate-500  via-violet-500 to-violet-700 hover:no-underline hover:scale-105 font-bold border-2 border-gray-100 ring-violet-500 ring-2 transition-all duration-300"
				>
					<Link href="/dashboard" className="flex gap-2 items-center">
						<span className="text-gray-200 text-xl md:text-2xl">
							Try {APP_NAME} {APP_NAME2}
						</span>
						<ArrowRight className="text-white dark:text-white" />
					</Link>
				</Button>
			</div>
		</section>
	);
};

export default Hero;
