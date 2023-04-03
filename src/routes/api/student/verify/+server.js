import { client } from '$lib/database';
import { json } from "@sveltejs/kit";
export const POST = async ({ request, locals }) => {
    const { id } = await request.json();
    const student = await client.student.findUnique({ where: { id: id } });
    if (!student) {
        return json({
            status: 404
        });
    }
    await client.student.update({
        where: {
            id: id
        },
        data: {
            verified: !student.verified
        }
    });
    return json({
        status: 200
    });
};
//# sourceMappingURL=+server.js.map