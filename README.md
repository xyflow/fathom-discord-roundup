# Fathom Analytics Report

This project sends weekly Fathom Analytics reports to a Discord channel. It fetches data from the Fathom Analytics API, compiles a weekly report on popular pages and total pageviews, and posts the report via a Discord webhook.

## Installation

1. Clone the repository:
   ```bash
   gh repo clone xyflow/fathom-analytics-report
   ```
2. Navigate to the project directory:
   ```bash
   cd fathom-analytics-report
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
FATHOM_API_TOKEN=your_fathom_api_token
FATHOM_SITE_ID=your_fathom_site_id
```

Also, update the `WEBHOOK_URL` in `index.js` as needed.

## Usage

Run the script manually by executing:

```bash
node index.js
```
