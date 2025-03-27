"use client";
import React, { useState } from "react";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";

export default function Header() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<header>
			<Navbar setMenuOpen={setMenuOpen} />
			<MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
		</header>
	);
}
