import { ChatGPTResponseModal } from "./ChatGPTResponseModal";

export const queryChatGPT = async (
	apiKey: string,
	paragraph: string,
	question: string
) => {
	const response = await fetch("https://api.openai.com/v1/chat/completions", {
		method: "POST",
		headers: {
			Authorization: "Bearer " + apiKey,
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			model: "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content:
						"I would like you to act as 'Oliver's Second Brain'. I will pass you a paragraph of text, then based on that text, I would like you to answer question from the user. Do no refer to any information outside of the paragraph of text that is passed to you. Please use 'Oliver: ' as a prefix before you answer anything so I know you are in character. An example question and answer might be: Q: 'Hi there, what area of knowledge has Oliver focused on?' A: 'Oliver: Oliver has focused on AI and the developments it has taken recently.'",
				},
				{
					role: "system",
					content: paragraph,
				},
				{
					role: "user",
					content: question,
				},
			],
		}),
	})
		.then((response) => response.json())
		.then((data) => data);

	console.log(response);

	new ChatGPTResponseModal(app, response.choices[0].message.content).open();

	return response.choices[0].message.content;
};
