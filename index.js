require("dotenv").config();
const fetch = require("node-fetch");

// Configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const FATHOM_API_TOKEN = process.env.FATHOM_API_TOKEN;
const FATHOM_SITE_ID = process.env.FATHOM_SITE_ID;

// Date range helpers
function getPreviousWeekRange() {
  const now = new Date();
  let isoDay = now.getUTCDay();
  if (isoDay === 0) isoDay = 7;
  const currentMonday = new Date(now);
  currentMonday.setUTCDate(now.getUTCDate() - (isoDay - 1));
  const prevMonday = new Date(currentMonday);
  prevMonday.setUTCDate(currentMonday.getUTCDate() - 7);
  const prevSunday = new Date(prevMonday);
  prevSunday.setUTCDate(prevMonday.getUTCDate() + 6);
  return { start: prevMonday, end: prevSunday };
}

function getWeekBeforeRange() {
  const lastWeek = getPreviousWeekRange();
  const start = new Date(lastWeek.start);
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(lastWeek.end);
  end.setUTCDate(end.getUTCDate() - 7);
  return { start, end };
}

function formatDate(date) {
  return (
    date.getUTCFullYear() +
    "-" +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getUTCDate()).padStart(2, "0") +
    " " +
    String(date.getUTCHours()).padStart(2, "0") +
    ":" +
    String(date.getUTCMinutes()).padStart(2, "0") +
    ":" +
    String(date.getUTCSeconds()).padStart(2, "0")
  );
}

// Fetch Fathom data
async function fetchAggregation(params) {
  const url = `https://api.usefathom.com/v1/aggregations?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${FATHOM_API_TOKEN}` },
  });
  if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
  return response.json();
}

// Generate the report
async function generateReport() {
  try {
    const lastWeek = getPreviousWeekRange();
    const weekBefore = getWeekBeforeRange();
    const date_from_last = formatDate(lastWeek.start);
    const date_to_last = formatDate(lastWeek.end);
    const date_from_before = formatDate(weekBefore.start);
    const date_to_before = formatDate(weekBefore.end);

    // Fetch popular pages for last week
    const popParamsLast = new URLSearchParams({
      entity: "pageview",
      entity_id: FATHOM_SITE_ID,
      aggregates: "pageviews",
      field_grouping: "pathname",
      sort_by: "pageviews:desc",
      limit: "15",
      date_from: date_from_last,
      date_to: date_to_last,
      timezone: "UTC",
    });
    const lastPages = (await fetchAggregation(popParamsLast)) || [];

    // Fetch popular pages for week before last
    const popParamsBefore = new URLSearchParams({
      entity: "pageview",
      entity_id: FATHOM_SITE_ID,
      aggregates: "pageviews",
      field_grouping: "pathname",
      sort_by: "pageviews:desc",
      limit: "20",
      date_from: date_from_before,
      date_to: date_to_before,
      timezone: "UTC",
    });
    const beforePages = (await fetchAggregation(popParamsBefore)) || [];
    const beforeMap = new Map();
    beforePages.forEach((page) => {
      if (page.pathname) beforeMap.set(page.pathname, Number(page.pageviews));
    });

    // Fetch total hits for last week
    const totParamsLast = new URLSearchParams({
      entity: "pageview",
      entity_id: FATHOM_SITE_ID,
      aggregates: "pageviews",
      date_from: date_from_last,
      date_to: date_to_last,
      timezone: "UTC",
    });
    const totalLastData = await fetchAggregation(totParamsLast);
    const totalLast =
      totalLastData && totalLastData[0] && totalLastData[0].pageviews
        ? Number(totalLastData[0].pageviews)
        : 0;

    // Fetch total hits for week before last
    const totParamsBefore = new URLSearchParams({
      entity: "pageview",
      entity_id: FATHOM_SITE_ID,
      aggregates: "pageviews",
      date_from: date_from_before,
      date_to: date_to_before,
      timezone: "UTC",
    });
    const totalBeforeData = await fetchAggregation(totParamsBefore);
    const totalBefore =
      totalBeforeData && totalBeforeData[0] && totalBeforeData[0].pageviews
        ? Number(totalBeforeData[0].pageviews)
        : 0;

    // Calculate changes
    const totalDelta = totalLast - totalBefore;
    const totalDeltaSign = totalDelta > 0 ? "+" : "";

    // Compile the final message
    const message = {
      username: "weekly fathom roundup bot",
      embeds: [
        {
          title: "reactflow.dev Traffic Report",
          fields: [
            {
              name: "🌐 Total Pageviews",
              value: `${totalLast.toLocaleString()} (${totalDeltaSign}${totalDelta.toLocaleString()})`,
              inline: true,
            },
            {
              name: "📅 Date Range",
              value: `${date_from_last.split(" ")[0]} to ${
                date_to_last.split(" ")[0]
              }`,
              inline: true,
            },
            {
              name: "🔝 Top Pages",
              value: lastPages
                .slice(0, 10)
                .map((page) => {
                  const lastViews = Number(page.pageviews);
                  const prevViews = beforeMap.get(page.pathname) || 0;
                  const delta = lastViews - prevViews;
                  const deltaSign = delta > 0 ? "+" : "";
                  return `→ ${
                    page.pathname
                  }: ${lastViews.toLocaleString()} (${deltaSign}${delta.toLocaleString()})`;
                })
                .join("\n"),
            },
          ],
          footer: {
            text: "Generated at " + new Date().toUTCString(),
          },
        },
      ],
    };

    return message;
  } catch (error) {
    return {
      username: "Traffic Bot - Error",
      content: `❌ Failed to generate report: ${error.message}`,
    };
  }
}

// Send to Discord via webhook
async function sendWebhook(message) {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (!response.ok) throw new Error(`Webhook failed: ${response.status}`);
    console.log("✅ Report sent successfully");
  } catch (error) {
    console.error("❌ Webhook error:", error);
  }
}

// Schedule and run
async function runScheduledReport() {
  const report = await generateReport();
  await sendWebhook(report);
}

runScheduledReport();
