type Trend = {
  name: string;
  summary: string;
  category: string;
  velocity: string;
  article_count: number;
};

type Article = {
  title: string;
  url: string;
  summary: string;
  actionableTakeaway: string;
  impactLevel: string;
  targetPersona: string;
};

type WeeklyReportData = {
  generatedAt: string;
  weekLabel: string;
  topTrends: Trend[];
  keyInsights: Article[];
  recommendedActions: string[];
};

export function renderNewsletterHtml(data: WeeklyReportData): string {
  const trendsHtml = data.topTrends
    .map(
      (t) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;">
        <strong style="color: #e2e8f0; font-size: 15px;">${escHtml(t.name)}</strong>
        <span style="margin-left: 8px; background: #1e3a5f; color: #60a5fa; font-size: 11px; padding: 2px 8px; border-radius: 99px;">${escHtml(t.category)}</span>
        ${t.velocity !== "0%" ? `<span style="margin-left: 4px; color: #34d399; font-size: 12px;">↑ ${escHtml(t.velocity)}</span>` : ""}
        <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 0;">${escHtml(t.summary)}</p>
      </td>
    </tr>`,
    )
    .join("");

  const insightsHtml = data.keyInsights
    .map(
      (a) => `
    <tr>
      <td style="padding: 14px 0; border-bottom: 1px solid #2a2a2a;">
        <a href="${escHtml(a.url)}" style="color: #60a5fa; font-size: 15px; font-weight: 600; text-decoration: none;">${escHtml(a.title)}</a>
        <span style="margin-left: 8px; font-size: 11px; color: #f59e0b;">${escHtml(a.impactLevel)} impact</span>
        <p style="color: #94a3b8; font-size: 13px; margin: 6px 0 4px;">${escHtml(a.summary)}</p>
        ${a.actionableTakeaway ? `<p style="color: #34d399; font-size: 12px; margin: 0;">→ ${escHtml(a.actionableTakeaway)}</p>` : ""}
      </td>
    </tr>`,
    )
    .join("");

  const actionsHtml = data.recommendedActions
    .map((a) => `<li style="color: #cbd5e1; font-size: 14px; margin-bottom: 8px;">${escHtml(a)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SignalAI Weekly: ${escHtml(data.weekLabel)}</title></head>
<body style="margin:0; padding:0; background:#0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;">
    <tr><td align="center" style="padding: 24px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

        <!-- Header -->
        <tr><td style="background:#111; border-radius:12px 12px 0 0; padding: 28px 32px; border-bottom: 1px solid #1e1e1e;">
          <h1 style="margin:0; font-size:22px; color:#e2e8f0;">⚡ SignalAI Weekly</h1>
          <p style="margin:6px 0 0; color:#64748b; font-size:13px;">${escHtml(data.weekLabel)} · AI signal, no noise</p>
        </td></tr>

        <!-- Top Trends -->
        <tr><td style="background:#111; padding: 24px 32px; border-bottom: 1px solid #1e1e1e;">
          <h2 style="margin:0 0 16px; font-size:16px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Top Trends This Week</h2>
          <table width="100%" cellpadding="0" cellspacing="0">${trendsHtml}</table>
        </td></tr>

        <!-- Key Insights -->
        <tr><td style="background:#111; padding: 24px 32px; border-bottom: 1px solid #1e1e1e;">
          <h2 style="margin:0 0 16px; font-size:16px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Key Insights</h2>
          <table width="100%" cellpadding="0" cellspacing="0">${insightsHtml}</table>
        </td></tr>

        <!-- Recommended Actions -->
        <tr><td style="background:#111; padding: 24px 32px; border-bottom: 1px solid #1e1e1e;">
          <h2 style="margin:0 0 16px; font-size:16px; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em;">Recommended Actions</h2>
          <ul style="margin:0; padding-left:20px;">${actionsHtml}</ul>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0a0a0a; border-radius:0 0 12px 12px; padding: 20px 32px; text-align:center;">
          <p style="margin:0; color:#475569; font-size:12px;">
            You're receiving this because you subscribed to SignalAI.
            <a href="{{unsubscribe_url}}" style="color:#64748b;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderNewsletterSubject(weekLabel: string): string {
  return `SignalAI Weekly: Top AI Signals for ${weekLabel}`;
}

export function renderPreviewText(trends: Trend[]): string {
  const names = trends
    .slice(0, 3)
    .map((t) => t.name)
    .join(", ");
  return `This week: ${names} and more.`;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
