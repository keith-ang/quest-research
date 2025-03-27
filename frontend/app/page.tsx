import Image from "next/image";
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import Pricing from "../components/home/Pricing";
import CTA from "../components/home/CTA";
import RevealOnScroll from "@/components/shared/RevealOnScroll";

export default function Home() {
	return (
		<div className="relative w-full">
			<div className="flex flex-col">
				<RevealOnScroll>
					<Hero />
					<Features />
					<Pricing />
					<CTA />
				</RevealOnScroll>
			</div>
		</div>
	);
}
