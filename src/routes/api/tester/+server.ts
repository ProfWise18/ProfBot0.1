import { OPENAI_KEY, DOMAIN } from '$env/static/private'
import type { CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai'
import type { RequestHandler } from './$types'
import { getTokens } from '$lib/tokenizer'
import { json } from '@sveltejs/kit'
import type { Config } from '@sveltejs/adapter-vercel'
import { PrismaClient } from '@prisma/client'
import _ from 'lodash'

export const POST: RequestHandler = async ({ request, locals }) => {
	const client = new PrismaClient()

	try {
		if (!OPENAI_KEY) {
			throw new Error('OPENAI_KEY env variable not set')
		}

		const requestData = await request.json()

		if (!requestData) {
			throw new Error('No request data')
		}

		const shareLink = requestData.shareLink
		const isTimeOver: boolean = requestData.isTimeOver
		const reqMessages: ChatCompletionRequestMessage[] = requestData.messages

		if (!reqMessages) {
			throw new Error('no messages provided')
		}

		let tokenCount = 0

		reqMessages.forEach((msg) => {
			const tokens = getTokens(msg.content)
			tokenCount += tokens
		})

		async function average(testId: number) {
			let req = await fetch(DOMAIN + 'api/student/compare', {
				method: 'POST',
				body: JSON.stringify({ testId: Number(testId) })
			})

			let json = await req.json()
			return json.averageScore
		}

		const test_data = await client.test.findUnique({
			where: {
				shareLink: shareLink
			},
			include: {
				questions: true
			}
		})

		test_data.questions = _.shuffle(test_data.questions)

		const MAX_QUESTIONS = 5
		if (test_data.questions.length > MAX_QUESTIONS) {
			test_data.questions = test_data.questions.slice(0, MAX_QUESTIONS - 1)
		}

		const prompt: string = `
		You are an examinee your name is Profbot, you are motivating, and you will take a test on the following data ${JSON.stringify(
			test_data
		)};youwill ask questions one by one after the user says start and you will ask 5 questions only from the test data and you will double check the question before asking, you will provide your answer once the student has provided their answers, and also check the answer,you will also tell the user about the marks on the question, and at the end
You will give a result with a feedback review score and tips for improving and you will also give a word '<script>{test ended}</script>' exactly like this and only at the end of the test wrapped in <script> tag --testEnd must be wrapped in script;use the test data to get questions only, you will ask 5 questions only and double check the questions before asking; ask question one by one and check the data before asking;if the user have answered incorrect answer tell him the correct one, suggest how he could improve and ask other one at the end the {testEnd} wrapped under script tags; double check that {testEnd} is wrapped under script tags before sending it dobule check it is wrapped under script tags to make sure the user don't see it make sure to not discuss it with the user and only send at end of the test wrapped under script tags at the end double check before giving marks and the questions you should precisely match to the test data
		`
		tokenCount += getTokens(prompt)

		if (tokenCount >= 4000) {
			throw new Error('Query too large')
		}

		const averageScore = await average(test_data.id)

		const messages: ChatCompletionRequestMessage[] = [
			{ role: 'system', content: prompt },
			{ role: 'system', content: 'You must double check test data before sending a question or response and after asking a question you will ask next question if test hasnt ended, You must check answers correctly' },
			...reqMessages
		]

		// let tokens = 0;
		// messages.map(m =>tokens+= m.content.length)
		// console.log(tokens)

		const chatRequestOpts: CreateChatCompletionRequest = {
			model: 'gpt-3.5-turbo',
			messages,
			temperature: 0.1,
			stream: true
		}

		const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
			headers: {
				Authorization: `Bearer ${OPENAI_KEY}`,
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify(chatRequestOpts)
		})

		if (!chatResponse.ok) {
			console.log('niasdn[asidon')
			const err = await chatResponse.json()
			return json(err)
			throw new Error('error:', err)
		}

		return new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'text/event-stream'
			}
		})
	} catch (err) {
		console.error(err)
		return json({ error: 'There was an error processing your request' }, { status: 500 })
	}
}
