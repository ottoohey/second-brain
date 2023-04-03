import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { getFiles, getSpecificFiles } from "./obsidianFunctions";
import { queryChatGPT } from "./chatGPTFunctions";

import { ObsidianFile } from "./ObsidianFile";
import { SplitObsidianFile } from "./SplitObsidianFile";

export const loadChromaDB = async (
	apiKey: string,
	chromaCollection: string
) => {
	// Get files that have been modified since last fine tune
	const files: ObsidianFile[] = await getFiles(app);

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
	const embedder = new OpenAIEmbeddingFunction(apiKey);

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

export const queryChroma = async (
	chromaCollection: string,
	apiKey: string,
	query: string
) => {
	const chromaClient = new ChromaClient();
	const embedder = new OpenAIEmbeddingFunction(apiKey);
	const collection = await chromaClient.getCollection(
		chromaCollection,
		embedder
	);

	const questionEmbedding = await embedder.generate([query]);

	const results = await collection.query(
		questionEmbedding, // query_embeddings
		2, // n_results
		undefined, // { "metadata_field": "is_equal_to_this" }, // where
		[query] // query_text
	);
	console.log(results);

	const files = await getSpecificFiles(app, results.documents[0]);

	let finalContent = "";

	files.forEach((file, index) => {
		const paragraph =
			file.content.split(/\n\n+/)[results.metadatas[0][index].paragraph];
		finalContent += " " + paragraph;
	});

	queryChatGPT(apiKey, finalContent, query);
};
