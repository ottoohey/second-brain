import { FileStats } from "obsidian";

export class ObsidianFile {
	path: string;
	content: string;
	tags: string[];
	timeData: FileStats;

	constructor(
		path: string,
		content: string,
		tags: string[],
		timeData: FileStats
	) {
		this.path = path;
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
