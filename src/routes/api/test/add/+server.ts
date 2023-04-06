import { client } from '$lib/database'
import { json } from '@sveltejs/kit'

export async function POST({ request }: any) {
  const formData = await request.formData()

  interface Question {
    questionText: string
    correctAnswer: string
    marks: number
  }

  const questions: Question[] = JSON.parse(formData.get('questions'))

  try {
    const test = await client.test.create({
      data: {
        name: formData.get('name'),
        shareLink: crypto.randomUUID()
      }
    })

    const newQuestions = await Promise.all(
      questions.map((question) =>
        client.question.create({
          data: {
            ...question,
            test: {
              connect: {
                id: test.id
              }
            }
          }
        })
      )
    )

    await client.test.update({
      where: { id: test.id },
      data: {
        questions: {
          connect: newQuestions.map((question) => ({ id: question.id }))
        }
      }
    })

    return json({ success: true })
  } catch (e) {
    console.log(e)
    return json({ success: false, message: e })
  }
}
