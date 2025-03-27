"use client";

import React, { useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ReportSectionDisplayProps } from "@/types";

// This RegExp matches patterns like [1], [2], [3][4], etc.
const CITATION_REGEX = /\[(\d+)\]/g;

export default function ReportSectionDisplay({
	section,
	references,
}: ReportSectionDisplayProps) {
	const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

	// Get URL by citation number from the references
	const getUrlByCitationNumber = (citationNumber: number): string | null => {
		const { url_to_unified_index } = references;
		for (const [url, index] of Object.entries(url_to_unified_index)) {
			if (index === citationNumber) {
				return url;
			}
		}
		return null;
	};

	// Get reference information by citation number
	const getReferenceInfo = (citationNumber: number) => {
		const url = getUrlByCitationNumber(citationNumber);
		if (url) {
			return {
				number: citationNumber,
				url: url,
				info: references.url_to_info[url],
			};
		}
		return null;
	};

	// Parse and render the section content with citations in Popovers
	const renderReport = (content: string) => {
		const parts = content.split(CITATION_REGEX);
		const result = [];
		let citationCount = 0; // Counter to create unique keys

		for (let i = 0; i < parts.length; i++) {
			// Add the text part
			result.push(<span key={`text-${i}`}>{parts[i]}</span>);

			// If there's a citation after this text part, add it
			if (i < parts.length - 1 && i % 2 === 0) {
				const citationNumber = parseInt(parts[i + 1]);
				const popoverId = `citation-${citationNumber}-${citationCount}`;
				citationCount++;

				const reference = getReferenceInfo(citationNumber);

				if (reference) {
					result.push(
						<Popover
							key={popoverId}
							open={openPopoverId === popoverId}
							onOpenChange={(open) => {
								setOpenPopoverId(open ? popoverId : null);
							}}
						>
							<PopoverTrigger asChild>
								<span className="text-blue-600 cursor-pointer font-medium inline-block">
									[{citationNumber}]
								</span>
							</PopoverTrigger>
							<PopoverContent
								className="w-80 max-h-100 p-0 overflow-auto dark:bg-gray-80"
								side="bottom"
								align="start"
							>
								<div className="p-4">
									<div className="flex justify-between items-center mb-2">
										<h3 className="font-bold text-lg dark:text-gray-100">
											Reference [{reference.number}]
										</h3>
									</div>

									<h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1 break-words">
										{reference.info.title}
									</h4>

									<a
										href={reference.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-sm text-blue-500 hover:underline mb-2 block truncate"
									>
										{reference.url}
									</a>

									{reference.info.snippets.length > 0 && (
										<div className="mt-2 text-sm">
											<div className="font-medium mb-1 dark:text-gray-100">
												Snippets:
											</div>
											<ul className="list-disc pl-5">
												{reference.info.snippets.map(
													(snippet, i) => (
														<li
															key={i}
															className="mb-1 text-gray-700 dark:text-gray-300"
														>
															{snippet}
														</li>
													)
												)}
											</ul>
										</div>
									)}

									<div className="mt-2 text-xs text-gray-500 dark:text-gray-100">
										Search query:{" "}
										{reference.info.meta.query}
									</div>
								</div>
							</PopoverContent>
						</Popover>
					);
				} else {
					// Fallback if reference is not found
					result.push(
						<span
							key={popoverId}
							className="text-blue-600 dark:text-gray-300 font-medium"
						>
							[{citationNumber}]
						</span>
					);
				}

				// Skip the citation part in the next iteration
				i++;
			}
		}

		return result;
	};

	// Determine heading style based on section level
	const getHeadingClass = () => {
		// Default to h1 size if level is not provided
		const level = section.level || 1;

		if (level === 1) {
			return "text-2xl font-semibold mb-4";
		} else {
			return "text-xl font-semibold mb-3";
		}
	};

	return (
		<div>
			<h2 className={getHeadingClass()}>{section.title}</h2>
			<div className="text-gray-700 leading-relaxed dark:text-gray-200">
				{renderReport(section.content)}
			</div>
		</div>
	);
}
