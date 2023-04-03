import { App } from "obsidian";
import { ObsidianFile } from "./ObsidianFile";

interface SecondBrainSettings {
	lastUpdated: string;
	unixLastUpdated: number;
	apiKey: string;
}

export const getCompleteFiles = async (app: App) => {
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

export const getFiles = async (
	app: App,
	settings: SecondBrainSettings,
	modified: boolean
) => {
	// for each file tagged with #second-brain
	// compare the last updated time against the saved setting updated time
	// anything more recent, process with ChatGPT

	const files = await getCompleteFiles(app);
	const updatedFiles: ObsidianFile[] = [];

	files.forEach((file) => {
		if (
			file.tags.contains("#second-brain")
			// &&
			// (file.timeData.mtime > settings.unixLastUpdated || modified)
		) {
			updatedFiles.push(
				new ObsidianFile(
					file.path,
					file.content,
					file.tags,
					file.timeData
				)
			);
		}
	});

	if (modified) {
		const date = Date.now();
		settings.lastUpdated = new Date(date).toLocaleString();
		settings.unixLastUpdated = date;
	}

	return updatedFiles;
};

export const getSpecificFiles = async (app: App, titles: string[]) => {
	const allFiles: ObsidianFile[] = [];

	for (const title of titles) {
		const files = app.vault
			.getFiles()
			.filter((file) => file.path.contains(title));

		const filesData = await Promise.all(
			files.map(async (file) => {
				const data = await app.vault.read(file);
				const cache = app.metadataCache.getFileCache(file);
				const timeData = file.stat;
				const tags = cache?.tags?.map((tag) => tag.tag) || [];
				return { path: file.path, content: data, tags, timeData };
			})
		);

		const obsidianFile: ObsidianFile = new ObsidianFile(
			filesData[0].path,
			filesData[0].content,
			filesData[0].tags,
			filesData[0].timeData
		);

		allFiles.push(obsidianFile);
	}

	console.log(allFiles);

	return allFiles;
};
