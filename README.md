# PetroSignal

PetroSignal is a web application that helps teams follow Venezuelan oil markets without piecing together news from many sources on their own. It collects regional petroleum intelligence, organizes it into daily briefings, and surfaces alerts when conditions change.

## What it does

PetroSignal runs several monitoring agents that watch different angles of the market—such as sanctions, national oil company activity, market moves, joint ventures, and social signals. Those agents feed a single intelligence terminal where you can see what matters for your role.

**Daily briefings** — Each weekday, PetroSignal produces structured briefings tailored to how you work. You can view them from the perspective of an investor, consultant, service company, compliance officer, or engineer. Each lens emphasizes the topics and risks most relevant to that role.

**Alerts** — When signals cross severity thresholds, PetroSignal raises alerts so you can react to shifts in sanctions, production, exports, or related developments without constantly scanning headlines.

**News wire** — A consolidated stream of articles and summaries gathered by the monitoring agents, tagged by topic and source so you can scan recent coverage in one place.

**Dashboard** — A terminal-style view that brings together your current briefing, live alerts, the news wire, market-style metrics, and agent health so you know whether data collection is running normally.

## Who it is for

- **Investors and portfolio teams** tracking sanctions, export flows, and benchmark spreads.
- **Advisors and operators** monitoring production signals, joint-venture activity, and terminal throughput.
- **Compliance and engineering teams** that need severity-ranked alerts and role-specific context without building a custom news stack.

## How to use it

After signing in, complete onboarding to choose your preferred briefing role and timezone. The main workspace is the **dashboard**, where you can switch roles, read the latest briefing, review alerts, and follow the live wire. Additional sections cover **alerts**, **news**, and **account settings**. Pricing, privacy, and terms pages are available from the app navigation.

PetroSignal is in beta. Access is free during this period; no payment is required to try the product.

## Running locally

If you are contributing to the project:

1. Install dependencies: `npm install`
2. Copy the environment template to `.env.local` and fill in values as needed for your setup.
3. Start the dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

Do not commit secrets or local environment files to version control.

## Legal

Privacy and terms of use are published in the app at `/privacy` and `/terms`.
