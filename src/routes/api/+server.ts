import { json } from "@sveltejs/kit";

export async function GET(){
  return json({message:"Welcome to profbot api ",version:0.2});
}