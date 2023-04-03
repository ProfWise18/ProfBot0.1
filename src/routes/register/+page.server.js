import { fail, redirect } from '@sveltejs/kit';
import { VITE_QSTASH_TOKEN, VITE_QSTASH_SECRET, DOMAIN } from '$env/static/private';
import { PrismaClient } from '@prisma/client';
import { client } from '$lib/database';
import bcrypt from "bcrypt";
export const load = async ({ locals }) => {
    // redirect user if logged in
    if (locals.user) {
        throw redirect(302, '/');
    }
};
function validateEmail(email) {
    const domain = '@torontoMU.ca';
    return email.endsWith(domain);
}
const register = async ({ cookies, request }) => {
    const data = await request.formData();
    const email = String(data.get('email'));
    const fname = String(data.get('fname'));
    const lname = String(data.get('lname'));
    const password = String(data.get('password'));
    const alreadyExists = await client.student.findUnique({ where: { email: email } });
    if (alreadyExists) {
        return fail(400, { credentials: true });
    }
    // if (!validateEmail(email)) {
    // 	return fail(500, { invalidEmail: true })
    // }
    // function validateEmail(email: string) {
    // 	const regex = /^[^\s@]+@torontoMU\.ca$/i
    // 	return regex.test(email)
    // }
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        return fail(400, { invalid: true });
    }
    const hashPassword = async (password, saltRounds = 10) => {
        try {
            // Generate a salt
            const salt = await bcrypt.genSalt(saltRounds);
            // Hash password
            return await bcrypt.hash(password, salt);
        }
        catch (error) {
            console.log(error);
        }
        // Return null if error
        return null;
    };
    const user = await client.student.create({
        data: {
            email: email,
            firstName: fname,
            lastName: lname,
            password: await hashPassword(password),
            userAuthToken: crypto.randomUUID(),
            credits: 1,
            verified: true
        }
    });
    await fetch(`${DOMAIN}/api/credits`, {
        method: "POST",
        body: JSON.stringify({ studentId: user.id, secret: VITE_QSTASH_SECRET }),
    });
    cookies.set('session', user.userAuthToken, {
        // send cookie for every page
        path: '/',
        // server side only cookie so you can't use `document.cookie`
        httpOnly: true,
        // only requests from same site can send cookies
        // https://developer.mozilla.org/en-US/docs/Glossary/CSRF
        // sameSite: 'strict',
        // only sent over HTTPS in production
        secure: process.env.NODE_ENV === 'production',
        // set cookie to expire after a month
        maxAge: 60 * 60 * 24 * 30
    });
    // redirect the user
    throw redirect(302, '/');
};
export const actions = { register };
//# sourceMappingURL=+page.server.js.map