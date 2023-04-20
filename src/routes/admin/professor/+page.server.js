import { client } from '$lib/database'
import { redirect} from '@sveltejs/kit';

export async function load({params,locals}){
  const data = await client.admin.findMany({
    include:{
      Test:true
    }
  });

  if(locals.admin.role != "ADMIN"){
    throw redirect(302, '/admin');
  }

  const tests = await client.creditsUsed.findMany({})

  // console.log(data)

  return {
    professors:data,
    tests,
  }
}