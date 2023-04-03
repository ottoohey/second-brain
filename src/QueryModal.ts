import { App, SuggestModal, Notice } from "obsidian";

import { queryChroma } from "./chromaFunctions";

interface Suggestion {
	query: string;
}

const SUGGESTIONS = [
	{
		query: "What does Oliver know about AI?",
	},
	{
		query: "Who is Oliver?",
	},
	{
		query: "What is Oliver's Second Brain?",
	},
];

export class QueryModal extends SuggestModal<Suggestion> {
	apiKey: string;
	chromaCollection: string;

	constructor(app: App, apiKey: string, chromaCollection: string) {
		super(app);
		this.apiKey = apiKey;
		this.chromaCollection = chromaCollection;
	}

	// Returns all available suggestions.
	getSuggestions(query: string): Suggestion[] {
		const suggestions = SUGGESTIONS.filter((suggestion) =>
			suggestion.query.toLowerCase().includes(query.toLowerCase())
		);

		if (suggestions.length === 0) {
			return [{ query: query }];
		} else {
			return suggestions;
		}
	}

	// Renders each suggestion item.
	renderSuggestion(suggestion: Suggestion, el: HTMLElement) {
		el.createEl("div", { text: suggestion.query });
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(
		suggestion: Suggestion,
		evt: MouseEvent | KeyboardEvent
	) {
		new Notice(`Selected ${suggestion.query}`);
		console.log(this.apiKey);

		queryChroma(this.chromaCollection, this.apiKey, suggestion.query);
	}
}
