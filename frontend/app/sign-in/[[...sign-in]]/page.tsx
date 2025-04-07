import { SignIn } from "@clerk/nextjs";

export default function Page() {
	return (
		<section className="flex justify-center items-center lg:min-h-[40vh]">
			<div className="py-20 max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
				<SignIn/>
			</div>
		</section>
	);
}
