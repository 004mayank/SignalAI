const BEEHIIV_BASE = "https://api.beehiiv.com/v2";

function getConfig() {
  const apiKey = process.env.BEEHIIV_API_KEY;
  const pubId = process.env.BEEHIIV_PUBLICATION_ID;
  if (!apiKey || !pubId) throw new Error("BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID must be set");
  return { apiKey, pubId };
}

export async function addSubscriber(email: string): Promise<string> {
  const { apiKey, pubId } = getConfig();
  const res = await fetch(`${BEEHIIV_BASE}/publications/${pubId}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, reactivate_existing: true, send_welcome_email: true }),
  });
  if (!res.ok) throw new Error(`Beehiiv subscribe failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { id: string } };
  return data.data.id;
}

export async function removeSubscriber(email: string): Promise<void> {
  const { apiKey, pubId } = getConfig();
  // Look up subscription id first
  const search = await fetch(
    `${BEEHIIV_BASE}/publications/${pubId}/subscriptions?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!search.ok) return;
  const body = (await search.json()) as { data?: { id: string }[] };
  const sub = body.data?.[0];
  if (!sub) return;

  await fetch(`${BEEHIIV_BASE}/publications/${pubId}/subscriptions/${sub.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

export async function sendNewsletter(params: {
  subject: string;
  previewText: string;
  body: string;
}): Promise<string> {
  const { apiKey, pubId } = getConfig();
  const res = await fetch(`${BEEHIIV_BASE}/publications/${pubId}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: params.subject,
      preview_text: params.previewText,
      content: { free: { web: params.body, email: params.body } },
      status: "confirmed",
      send_at: new Date().toISOString(),
      audience: "free",
    }),
  });
  if (!res.ok) throw new Error(`Beehiiv send newsletter failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { data: { id: string } };
  return data.data.id;
}
