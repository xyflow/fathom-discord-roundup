# Fathom Analytics Reporting for Discord

This project sends weekly Fathom Analytics reports to a Discord channel.

## Project Overview

- **Data Retrieval:** The script uses [Fathom Analytics](https://usefathom.com) Aggregations API to obtain weekly analytics data.
- **Report Generation:** It calculates the number of pageviews for the previous week, compares them to the week before, and highlights the top pages.
- **Notification:** The final report is sent to a Discord channel using a webhook.
- **Automation:** A GitHub Actions workflow (configured via a YAML file) can run the script on a schedule (every Tuesday at 9 AM UTC) or be triggered manually.

## Installation

1. Clone the repository:
   ```bash
   gh repo clone xyflow/fathom-discord-roundup
   ```
2. Navigate to the project directory:
   ```bash
   cd fathom-discord-roundup
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
   Or, if using npm:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the project root directory and add your credentials:

```env
DISCORD_WEBHOOK_URL=your_discord_webhook
FATHOM_API_TOKEN=your_fathom_api_token
FATHOM_SITE_ID=your_fathom_site_id
```

## Creating a Discord Webhook

1. Open Discord and navigate to the channel where you want to post the report.
2. Click the settings icon (gear) next to the channel name.
3. Select **Integrations**, then click on **Webhooks**.
4. Click **New Webhook** and give it a name (e.g., "Fathom Report Bot").
5. Copy the **Webhook URL** and paste it into your `.env` file as the `DISCORD_WEBHOOK_URL`.
6. Save the changes.

## Usage

Run the script manually by executing:

```bash
node index.js
```
