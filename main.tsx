import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';

import { loadChromaDB } from "./src/chromaFunctions";

import { ApiKeyModal } from "./src/ApiKeyModal";
import { QueryModal } from "src/QueryModal";

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

const CHROMA_COLLECTION = "obsidian_collection";

export default class SecondBrain extends Plugin {
	settings: SecondBrainSettings;

	async onload() {
		await this.loadSettings();
		const ribbonIconEl = this.addRibbonIcon(
			"refresh-cw",
			"Second Brain",
			async (evt: MouseEvent) => {

				const chromaClient = new ChromaClient();
				const embedder = new OpenAIEmbeddingFunction(this.settings.apiKey);

				await chromaClient.reset();
				await chromaClient.createCollection(CHROMA_COLLECTION, {}, embedder);

				loadChromaDB(this.settings.apiKey, CHROMA_COLLECTION);

				new Notice("ChromaDB Functionality");
			}
		);

		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "open-api-key-modal",
			name: "Enter OpenAI API Key",
			callback: () => {
				new ApiKeyModal(this.app, (result) => {
					this.settings.apiKey = result;
					console.log(this.settings.apiKey);
				}).open();
			},
		});

		this.addCommand({
			id: "open-modal-query-chroma-collection",
			name: "Query Chroma Collection",
			callback: async () => {
				new QueryModal(this.app, this.settings.apiKey, CHROMA_COLLECTION).open();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SecondBrainSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			// console.log("click", evt);
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
