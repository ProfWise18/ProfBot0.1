import { json } from "@sveltejs/kit";

export async function GET(){
  return json({message:"profbot api",version:0.1});
}