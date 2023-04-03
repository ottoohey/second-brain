import { App, Modal } from "obsidian";

export class ChatGPTResponseModal extends Modal {
	content: string;

	constructor(app: App, content: string) {
		super(app);
		this.content = content;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "ChatGPT Response" });
		contentEl.createEl("p", { text: this.content });
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
