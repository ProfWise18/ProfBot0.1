import { VITE_QSTASH_TOKEN, DOMAIN, VITE_QSTASH_SECRET } from '$env/static/private'
import { json } from '@sveltejs/kit'
import type { RequestEvent, RequestHandler } from './$types'
import { client } from '$lib/database'

export async function POST({ request }: RequestEvent) {
	const { studentId, secret } = await request.json()
	if (secret != VITE_QSTASH_SECRET) {
		return json('Error')
	}

	await client.student.update({
		where: { id: studentId },
		data: {
			credits: {
				increment: 1
			}
		}
	})

	return json('fetch completed')
}
