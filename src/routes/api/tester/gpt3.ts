import { OPENAI_KEY } from "$env/static/private";
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "../$types";
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage, } from 'openai'
import { Configuration,OpenAIApi } from 'openai'

export async function POST({locals,request,prisma}:any){
  try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		const configuration = new Configuration({
			apiKey: OPENAI_KEY,
		});
		const openai = new OpenAIApi(configuration);
		console.log(requestData)

		const response = await openai.createCompletion({
			model: "text-curie-001",
			prompt: `is the answer to the question "${requestData.question}" = "${requestData.answer}" the total marks are ${requestData.marks} and give marks accordingly.`,
			temperature: 0.1,
			max_tokens: 256,
			top_p: 0.2,
			frequency_penalty: 0,
			presence_penalty: 0,
		});

		return json(response.data.choices[0].text)

		if (!requestData) {
			throw new Error('No request data')
		}
  }catch(error){
    console.log(error);
  }
}