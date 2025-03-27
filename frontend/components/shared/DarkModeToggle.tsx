"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		setTheme(theme === "dark" ? "light" : "dark");
	};

	if (!mounted) {
		return (
			<div className="w-14 h-7 bg-gray-200 rounded-full flex items-center p-1">
				<div className="w-5 h-5 rounded-full bg-white"></div>
			</div>
		);
	}

	return (
		<button
			onClick={toggleTheme}
			className={`
        relative w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none
        ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}
      `}
			aria-label="Toggle theme"
		>
			<span className="sr-only">Toggle theme</span>

			{/* Track icons */}
			<Sun
				className="absolute left-1.5 top-1.5 h-4 w-4 text-gray-200 transition-opacity duration-300 
        opacity-100 dark:opacity-40"
			/>
			<Moon
				className="absolute right-1.5 top-1.5 h-4 w-4 text-slate-700 transition-opacity duration-300 
        opacity-40 dark:opacity-100 dark:text-blue-100"
			/>

			{/* Slider thumb */}
			<div
				className={`
          w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300
          ${theme === "dark" ? "translate-x-7" : "translate-x-0"}
        `}
			></div>
		</button>
	);
}
