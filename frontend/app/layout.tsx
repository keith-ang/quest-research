import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "sonner";
import { WebSocketProvider } from "@/lib/contexts/WebSocketContext";

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
	title: "Quest Research",
	description:
		"LLM based autonomous agent that conducts local and web research on any topic and generates a comprehensive report with citations.",
	icons: {
		icon: "../images/quest-logo.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${poppins.variable} antialiased vsc-initialized`}
				>
					<WebSocketProvider>
						<ThemeProvider
							attribute="class"
							enableSystem
							defaultTheme="system"
						>
							{/* Dark mode background */}
							<div className="fixed inset-0 -z-10 h-full w-full dark:block hidden [background:radial-gradient(125%_125%_at_50%_10%,#1d1d1d_40%,#5f2bed_100%)]"></div>

							{/* Light mode background */}
							<div className="fixed inset-0 -z-10 h-full w-full dark:hidden block bg-white [background:radial-gradient(125%_125%_at_50%_10%,#d4d4d4_40%,#63e_100%)]"></div>

							<div className="relative flex h-screen w-full flex-col">
								<Header />
								<main className="flex-1">{children}</main>
								{/* <Footer /> */}
							</div>
							<Toaster position="bottom-right" duration={5000} />
						</ThemeProvider>
					</WebSocketProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
