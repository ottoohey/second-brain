import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { getFiles } from "./obsidianFunctions";

import { ObsidianFile } from "./ObsidianFile";
import { SplitObsidianFile } from "./SplitObsidianFile";

interface SecondBrainSettings {
	lastUpdated: string;
	unixLastUpdated: number;
	apiKey: string;
}

export const loadChromaDB = async (
	settings: SecondBrainSettings,
	chromaCollection: string
) => {
	// Get files that have been modified since last fine tune
	const files: ObsidianFile[] = await getFiles(app, settings, true);

	const splitContents: SplitObsidianFile[] = [];

	files.forEach((file) => {
		const split = file.content.split(/\n\n+/);

		split.forEach((paragraph, index) => {
			const splitContent: SplitObsidianFile = new SplitObsidianFile(
				file.path,
				paragraph,
				index
			);
			splitContents.push(splitContent);
		});
	});

	const ids = [];
	const embeddingDocs = [];
	const metadata = [];
	const documents = [];

	const chromaClient = new ChromaClient();
	const embedder = new OpenAIEmbeddingFunction("API_KEY");

	let index = 0;

	for (const item of splitContents) {
		ids.push(index.toString());

		embeddingDocs.push(item.content);

		metadata.push({ paragraph: item.paragraph });

		documents.push(item.title);

		index++;
	}

	const embeddings = await embedder.generate(embeddingDocs);

	console.log(ids);
	console.log(embeddings);
	console.log(metadata);
	console.log(documents);

	const collection = await chromaClient.getCollection(
		chromaCollection,
		embedder
	);
	await collection.add(ids, embeddings, metadata, documents);
};
