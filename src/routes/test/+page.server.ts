import { client } from '$lib/database'
import { redirect } from '@sveltejs/kit'

export async function load({ params, locals }) {
	if (!locals.user && !locals.admin) {
		throw redirect(302, '/')
	}
  const tests = await client.test.findMany({})

  if(locals.admin && locals.user){
    const user = await client.admin.findFirst({
      where:{
        email:locals.admin.email
      }
    })
    return { user,admin:null, tests }
  }

  if(locals.user){
    const user = await client.student.findUnique({
      where: {
        email: locals.user.email
      }
    })
  
    return { user,admin:null, tests }
  }

  if(locals.admin){
    const user = await client.admin.findFirst({
      where:{
        email:locals.admin.email
      }
    })
    return { admin:user,user:null, tests }
  }


}
