import {client} from "$lib/database";
import { json, redirect } from "@sveltejs/kit";

export async function load({locals}){

  if(locals.admin.role != "ADMIN"){
    throw redirect(302,"/admin");
  }
  const students = await client.student.findMany({
    include:{
      creditsUsed:true
    }
  });

  return {
    students:students
  };
}