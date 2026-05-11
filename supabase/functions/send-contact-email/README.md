# send-contact-email (Edge Function — future)

## Purpose

When a visitor submits the Den Den Mushi contact form, a row is inserted into `public.messages`.
This Edge Function (not yet deployed) will fire via a **Supabase Database Webhook** on `messages.INSERT`
and send a formatted email to the portfolio owner using the **Resend** transactional email API.

## When to deploy

Deploy when you want real-time email notifications for new contact messages.
Until then, log into the Supabase dashboard and read the `messages` table manually.

## Setup steps

1. Create a free account at https://resend.com and generate an API key.
2. Add the key to Supabase secrets:
   ```
   supabase secrets set RESEND_API_KEY=re_xxxx
   ```
3. Implement `index.ts` (Deno):
   ```ts
   import { serve } from 'https://deno.land/std/http/server.ts';

   serve(async (req) => {
     const { record } = await req.json(); // { name, email, message, mode, created_at }

     await fetch('https://api.resend.com/emails', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         from: 'portfolio@yourdomain.com',
         to: 'dbtzur@gmail.com',
         subject: `New contact from ${record.name}`,
         html: `<p><b>From:</b> ${record.name} &lt;${record.email}&gt;</p>
                <p><b>Mode:</b> ${record.mode}</p>
                <p><b>Message:</b><br>${record.message.replace(/\n/g, '<br>')}</p>`,
       }),
     });

     return new Response('ok');
   });
   ```
4. Deploy the function:
   ```
   supabase functions deploy send-contact-email
   ```
5. Create a Database Webhook in the Supabase dashboard:
   - Table: `messages`
   - Event: `INSERT`
   - URL: your deployed Edge Function URL
