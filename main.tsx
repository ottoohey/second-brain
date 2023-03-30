import {
	App,
	FileStats,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';

interface SecondBrainSettings {
	lastUpdated: string;
	unixLastUpdated: number;
	apiKey: string;
}

const DEFAULT_SETTINGS: SecondBrainSettings = {
	lastUpdated: "Never Updated",
	unixLastUpdated: 0,
	apiKey: "",
};

interface TrainingData {
	prompt: string;
	completion: string;
}

export default class SecondBrain extends Plugin {
	settings: SecondBrainSettings;

	async onload() {
		await this.loadSettings();
		const ribbonIconEl = this.addRibbonIcon(
			"star",
			"Second Brain",
			async (evt: MouseEvent) => {

				const chromaClient = new ChromaClient();
				const embedder = new OpenAIEmbeddingFunction("key");

				await chromaClient.createCollection("my_collection", {}, embedder);

				// const collection = await chromaClient.getCollection("my_collection", embedder);

				// 	undefined,
				// 	["ark invest", "inteview questions"]
				// )

				// const results = await collection.query(
				// 	undefined,
				// 	2,
				// 	undefined,
				// 	['Five innovation platforms']
				// );

				// console.log("results: " + results);

				new Notice("ChromaDB Functionality");
			}
		);

		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This creates an icon in the left ribbon.
		const circleIconEl = this.addRibbonIcon(
			"circle",
			"Second Brain",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.

				// Get files that have been modified since last fine tune
				const files: ObsidianFile[] = await this.checkModifiedFiles();

				// // Combine files
				// const combinedContent = this.combineFiles(files);

				// // Split into 4000 token chunks
				// const splitContent = this.splitContent(combinedContent);

				// // Get ChatGPT to generate training data
				// const trainingData = await this.getTrainingData(splitContent);

				// // Get JSON of training data
				// const jsonData: TrainingData[] = JSON.parse(trainingData);

				// // Create markdown table so human readable
				// const markdownTable = this.createMarkdownTable(jsonData);

				// // Add markdown table to training data file for user to inspect
				// this.modifyTrainingDataFile(markdownTable);

				// // create JSONL doc
				// const jsonlDoc = this.markdownToJSONL(markdownTable);

				// files.forEach((file) => {
				// 	const split = file.content.split(/\n\n+/);
				// 	console.log(split);
				// });

				const split = files[0].content.split(/\n\n+/);

				const ids = [];
				const embeddingDocs = [];
				const metadata = [];
				const documents = [];

				const chromaClient = new ChromaClient();
				const embedder = new OpenAIEmbeddingFunction("sk-")

				// const embedding = await embedder.generate([split[0]]);
				// embeddings.push(embedding);

				let index = 0;

				for (const paragraph of split) {

					ids.push(index.toString());

					// const embedding = await embedder.generate([paragraph]);
					embeddingDocs.push(paragraph);

					metadata.push({ "paragraph": index });

					documents.push("Macquarie Interview " + index);

					index++;
				}

				const embeddings = await embedder.generate(embeddingDocs);

				console.log(ids);
				console.log(embeddings);
				console.log(metadata);
				console.log(documents);

				const collection = await chromaClient.getCollection("my_collection", embedder);
				await collection.add(
					ids,
					embeddings,
					metadata,
					documents
				)

				new Notice("Change the notice!");
			}
		);
		// Perform additional things with the ribbon
		circleIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "open-custom-modal-simple",
			name: "Open custom modal (second-brain)",
			callback: () => {
				new ApiKeyModal(this.app, (result) => {
					this.settings.apiKey = result;
					console.log(this.settings.apiKey);
				}).open();
			},
		});

		this.addCommand({
			id: "open-modal-reset-chroma",
			name: "Reset Chroma",
			callback: async () => {
				const chromaClient = new ChromaClient();
				await chromaClient.reset();
			},
		});

		this.addCommand({
			id: "open-modal-list-chroma-collections",
			name: "List Chroma Collections",
			callback: async () => {
				const chromaClient = new ChromaClient();
				const collections = await chromaClient.listCollections();
				console.log(collections);
			},
		});

		this.addCommand({
			id: "open-modal-query-chroma-collection",
			name: "Query Chroma Collection",
			callback: async () => {
				const chromaClient = new ChromaClient();
				const embedder = new OpenAIEmbeddingFunction("sk-")
				const collection = await chromaClient.getCollection("my_collection", embedder);
				const results = await collection.query(
					undefined, // query_embeddings
					1, // n_results
					undefined,
					// { "metadata_field": "is_equal_to_this" }, // where
					["When have you experienced conflict at work"], // query_text
				)
				console.log(results);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SecondBrainSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
		 * Get all Markdown files in the vault with their content and tags
		 * @param {App} app
		 * @returns {Promise<{path: string, content: string, tags: string[]}[]>}
		 */
	getCompleteFiles = async (app: App) => {
		const files = app.vault
			.getFiles()
			.filter((file) => file.extension === "md");
		const filesData = await Promise.all(
			files.map(async (file) => {
				const data = await app.vault.read(file);
				const cache = app.metadataCache.getFileCache(file);
				const timeData = file.stat;
				const tags = cache?.tags?.map((tag) => tag.tag) || [];
				return { path: file.path, content: data, tags, timeData };
			})
		);
		return filesData;
	};

	async checkModifiedFiles() {
		// for each file tagged with #second-brain
		// compare the last updated time against the saved setting updated time
		// anything more recent, process with ChatGPT

		const files = await this.getCompleteFiles(this.app);
		const updatedFiles: ObsidianFile[] = [];

		files.forEach((file) => {
			if (
				file.tags.contains("#second-brain") &&
				file.timeData.mtime > this.settings.unixLastUpdated
			) {
				// console.log("New data, updating: " + file.path);
				updatedFiles.push(new ObsidianFile(file.path, file.content, file.tags, file.timeData));
			} else {
				// console.log("Removed: " + file.path);
			}
		});

		const date = Date.now();
		this.settings.lastUpdated = new Date(date).toLocaleString();
		this.settings.unixLastUpdated = date;

		return updatedFiles;
	}

	combineFiles(files: ObsidianFile[]) {

		let combinedContent = "";

		files.forEach(file => {
			combinedContent += file.getContent;
		});

		return combinedContent;
	}

	splitContent(combinedContent: string) {
		const split = combinedContent.split('\n\n')
		const splitArray: string[] = [""];
		let lastIndex = splitArray.length - 1;

		// if last string in array + paragraph length < 16000, add paragraph to last array string
		// else, create new string in array and add paragraph
		split.forEach(function (item) {
			if (splitArray[lastIndex].length + item.length < 16000) {
				splitArray[lastIndex] += item;
			} else {
				splitArray.push(item);
				lastIndex += 1;
			}
		})

		return splitArray;

	}

	async getTrainingData(splitArray: string[]) {
		const response = await fetch(
			'https://api.openai.com/v1/chat/completions',
			{
				method: 'POST',
				headers: {
					Authorization: this.settings.apiKey,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					model: "gpt-3.5-turbo",
					messages: [
						{
							role: "system",
							content: "Hi, I want you to pretend you are a data scientist tasked with training ChatGPT with some custom data. The idea is to allow the new AI model to look at a users personal knowledge base and act as an assistance for anyone who wants to ask questions about it. I am going to paste below an example of one of the documents and I would like you to create a JSON document with a list of prompt and ideal completion examples based of the contents of the document. I only want the pairs of prompts and completions in a single array, like this: [{prompt: 'first prompt', completion: 'first completion'}, {prompt: 'second prompt', completion: 'second completion'}]. Please do not include anything but the JSON Document in your response"
						},
						{
							role: "user",
							// content: splitArray[0]
							content: "ChatGPT 3.5 incorporated Reinforcment Learning from Human Feedback (RLHF), which used feedback to improve the models accuracy, improve answers and reduce harmful responses. Text-to-code is becoming more prevelant with GitHub's Copilot, which assists user programming with autocomplete. There is also DeepMind's AlphaCode, which generates code based on a written description. There are multiple other applications of AI which are all being worked on right now, such as text to image, text to 3D, 2D to 3D and voice simulation."
						}
					]
				}),
			}
		)
			.then((response) => response.json())
			.then((data) => data);

		console.log(response);
		return response.choices[0].message.content
	}

	modifyTrainingDataFile(trainingData: string) {
		const files = app.vault
			.getFiles()
			.filter((file) => file.name === "Test.md");

		app.vault.append(files[0], "### " + this.settings.lastUpdated + '\n');
		app.vault.append(files[0], trainingData + '\n\n');
	}

	createMarkdownTable(data: TrainingData[]): string {
		let markdownTable = `|Prompt|Completion|\n|---|---|\n`;

		data.forEach(({ prompt, completion }) => {
			markdownTable += `|${prompt}|${completion}|\n`;
		});

		return markdownTable;
	}

	markdownToJSONL(markdown: string): string {
		const rows = markdown.split('\n').map(row => row.trim());
		rows.pop();

		const headers = rows.splice(0, 2).shift().split('|').slice(1, -1).map(header => header.trim());

		const jsonlArray = rows.map(row => {
			const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
			const jsonlObject = {};
			headers.forEach((header, index) => {
				jsonlObject[header.toLowerCase()] = cells[index];
			});
			return jsonlObject;
		});

		const jsonL = jsonlArray.map(x => JSON.stringify(x)).join('\n')

		return jsonL;
	}
}

export class ApiKeyModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Enter your key" });
		contentEl.createEl("p", { text: "This will never be shared with anyone, nor will it be visible to you again." });

		new Setting(contentEl)
			.setName("OpenAI API Key")
			.addText((text) =>
				text.onChange((value) => {
					this.result = value
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.result);
					}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SecondBrainSettingsTab extends PluginSettingTab {
	plugin: SecondBrain;

	constructor(app: App, plugin: SecondBrain) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Settings for your Second Brain" });

		new Setting(containerEl)
			.setName("Last Model Update")
			.setDesc(
				"This is the last time your model was updated with data from your Vault"
			)
			.addText((text) =>
				text
					.setPlaceholder("Date will return ;)")
					.setValue(this.plugin.settings.lastUpdated)
			);
	}
}

class ObsidianFile {

	path: string;
	content: string;
	tags: string[];
	timeData: FileStats;

	constructor(path: string, content: string, tags: string[], timeData: FileStats) {
		this.path = path
		this.content = content;
		this.tags = tags;
		this.timeData = timeData;
	}

	public get getPath(): string {
		return this.path;
	}

	public get getContent(): string {
		return this.content;
	}


	public get getTags(): string[] {
		return this.tags;
	}


	public get getTimeData(): FileStats {
		return this.timeData;
	}


}
