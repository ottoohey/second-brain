import {
	App,
	Editor,
	FileStats,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!
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

export default class SecondBrain extends Plugin {
	settings: SecondBrainSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"star",
			"Second Brain",
			async (evt: MouseEvent) => {
				// Called when the user clicks the icon.

				const files: ObsidianFile[] = await this.checkModifiedFiles();

				this.combineFiles(files);

				new Notice("Change the notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

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

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
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
				console.log("New data, updating: " + file.path);
				updatedFiles.push(new ObsidianFile(file.path, file.content, file.tags, file.timeData));
			} else {
				console.log("Removed: " + file.path);
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

		console.log(combinedContent);
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
