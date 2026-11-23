interface CFContext {
  request: Request;
  env: Record<string, string | undefined>;
}

const FEEDBACK_RECIPIENT = 'stevenevel003@gmail.com';

function sanitizeSingleLine(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, maxLen);
}

export async function onRequestPost({ request, env }: CFContext) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      email?: unknown;
      message?: unknown;
      gameTitle?: unknown;
    };

    const name = sanitizeSingleLine(body.name, 100);
    const email = sanitizeSingleLine(body.email, 160);
    const gameTitle = sanitizeSingleLine(body.gameTitle, 120);
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

    if (!name) {
      return Response.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Please enter a valid reply email address.' }, { status: 400 });
    }
    if (message.length < 3) {
      return Response.json(
        { error: 'Please enter a comment or feedback message.' },
        { status: 400 }
      );
    }

    const subject = gameTitle
      ? `ProtoX Games Feedback (${gameTitle}) from ${name}`
      : `ProtoX Games Feedback from ${name}`;
    const bodyLines = [
      `From: ${name} <${email}>`,
      gameTitle ? `Game: ${gameTitle}` : null,
      '',
      message,
    ]
      .filter((line) => line !== null)
      .join('\n');

    const mailtoUrl = `mailto:${FEEDBACK_RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines)}`;

    let deliveredViaEmail = false;
    const resendApiKey = env.RESEND_API_KEY?.trim() || '';
    if (resendApiKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: env.RESEND_FROM_EMAIL?.trim() || 'ProtoX Games Feedback <onboarding@resend.dev>',
          to: [FEEDBACK_RECIPIENT],
          reply_to: email,
          subject,
          text: bodyLines,
        }),
      });
      deliveredViaEmail = emailRes.ok;
    }

    return Response.json({
      ok: true,
      deliveredViaEmail,
      recipient: FEEDBACK_RECIPIENT,
      mailtoUrl,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to process feedback.' },
      { status: 500 }
    );
  }
}
