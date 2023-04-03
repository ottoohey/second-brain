export class SplitObsidianFile {
	title: string;
	content: string;
	paragraph: number;

	constructor(title: string, content: string, paragraph: number) {
		this.title = title;
		this.content = content;
		this.paragraph = paragraph;
	}

	public get getTitle(): string {
		return this.title;
	}

	public get getContent(): string {
		return this.content;
	}

	public get getParagraph(): number {
		return this.paragraph;
	}
}
