// import Image from "next/image";
import Hero from "../components/home/Hero";
// import Features from "../components/home/Features";
// import Pricing from "../components/home/Pricing";
// import CTA from "../components/home/CTA";

export default function Home() {
	return (
		<div className="flex flex-col h-full">
			<Hero />
			{/* <Features />
					<Pricing />
					<CTA /> */}
		</div>
	);
}
