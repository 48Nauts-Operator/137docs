# 📊 137Docs Analytics Dashboard – Overview (V2)

## 🌟 Goal

To provide a **comprehensive, interactive analytics overview** of the user's document-driven financial landscape (private or business). The dashboard supports fast decision-making, trend identification, and contextual insights across time, tags, contacts, and categories.

---

## 🔀 Time Control (Header)

### Toggle Bar:

```
Daily | Weekly | Monthly | Quarterly | Yearly
```

* Includes arrow or dropdown navigation to switch between years (e.g., 2025 ⬅️ 2024 ⬅️ 2023)
* Selection updates all visible graphs and statistics

---

## 📦 Overview Cards (Top Row)

| Metric                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| **Total Spent**         | Aggregate total for selected period                         |
| **Total VAT**           | Sum of VAT amounts extracted from invoices                  |
| **# Invoices**          | Count of all invoices processed                             |
| **Change vs Previous**  | Percentage difference with visual indicator (e.g. 🔼 +8.4%) |
| **Outstanding Balance** | Sum of unpaid invoice amounts                               |

---

## 📊 Spending Trend (Main Line Chart)

* Displays total expenditure trend across selected period
* Toggle overlays for **Top N Categories** (Hosting, Cloud, Legal, etc.)
* Tooltip reveals:

  * Amount on hover
  * Associated contacts or categories
* Optional stacked chart mode to differentiate fixed vs flexible spending

---

## 🔝 Top Spend Analysis (Two Columns)

### 1. Top Contacts / Vendors

* Horizontal bar chart
* Supplementary table:

  * Contact Name
  * Number of Transactions
  * Total Amount
  * Top Category
  * Last Activity Date

### 2. Top Tags

* Pie chart
* Total by tag
* % share and color-coded segments

---

## 📊 Additional Breakdown Widgets

| Widget                          | Description                                       |
| ------------------------------- | ------------------------------------------------- |
| **Category Distribution**       | Pie or stacked bar by document type/category      |
| **Spending by Currency**        | Bar or donut segmented by CHF, USD, EUR, etc.     |
| **Biggest Changes**             | Table of largest cost increases since last period |
| **Expenditures by Source Type** | Invoice, Contract, Utility, etc. classification   |

---

## 🔍 Dynamic Filters (Sidebar or Top-Right Panel)

* 📅 Date Range Picker
* 🗒️ Contact Dropdown
* 🏷️ Tag / Category Filter
* 📂 Document Type: Invoice, Contract, Fine, etc.
* 💰 Status: Paid, Unpaid, Overdue

---

## 🧑‍🧐 Smart Highlights (Optional AI-Powered Box)

Dynamic insights and recommendations:

* "Your spending on software subscriptions increased by 40% this quarter."
* "Invoice from Swisscom is overdue by 12 days."
* "Hosting costs from AWS and Google Cloud may be consolidated."

---

## 📄 Export / Interop Options

* Export View: PDF or CSV
* Sync Timeline: Export invoice due dates as `.ics` calendar
* Interlink: Enable smart insights to be shared with **DocAI agents**

---

## ✅ Future Enhancements (Phased Goals)

| Phase | Feature                                                       |
| ----- | ------------------------------------------------------------- |
| v2.1  | Revenue charts (inbound payments for business dashboards)     |
| v2.2  | Billability tracking and chargeability % (freelance use case) |
| v2.3  | Estimated profit margins (incoming vs outgoing)               |
| v2.4  | Multi-year comparison charts                                  |

---

## 🔹 Notes for Developer

* Components should use **Recharts** or equivalent modern React charting lib.
* The UI grid layout should be **responsive** (12-grid or CSS grid system).
* Filters and selections should work reactively.
* Consider including **animated transitions** or skeleton states for loading.

---
Great question — and timely, considering you’re redesigning the Analytics Dashboard V2.

Here are key design elements and UI principles you should consider adopting from SCAD (ShadCN + Card + Analytics Dashboard) aesthetics:

⸻

🔷 ShadCN Design Elements to Leverage

1. Card-Based Layout
	•	Use cards for each metric or chart (e.g., Total Spend, Spending by Tag).
	•	Add hover effects (hover:shadow-lg) for interactivity.
	•	Use Card, CardHeader, CardContent, CardFooter from ShadCN.

2. Dark Mode-First Palette
	•	Maintain consistent use of soft backgrounds (bg-muted/20, bg-secondary/30).
	•	Ensure text is readable with contrast-aware classes (text-muted-foreground, text-primary).
	•	Use gradients subtly for highlights (e.g., in Spending Trend graphs).

3. Modular Grid Layout
	•	Apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for responsive distribution.
	•	Use gap-4 or gap-6 for breathing room between visual modules.

4. Compact, Legible Typography
	•	ShadCN uses Tailwind’s text-sm, text-xs, and font-medium/font-bold effectively.
	•	Use uppercase tracking-wide text-muted for section labels.

⸻

📊 Chart Aesthetics for Analytics

ShadCN doesn’t include charts natively, but when used with Recharts, Nivo, or Chart.js, ensure:
	•	Rounded corners on bar/column charts (<Bar radius={[8, 8, 0, 0]} />)
	•	Soft, muted lines on line charts (strokeOpacity, strokeWidth=2)
	•	Use transparent backgrounds and avoid grid clutter
	•	Pie/Donut charts should follow the same muted palette (fill="#6366f1" etc.)

⸻

🧩 Micro-Interactions
	•	Use Popover and Tooltip from ShadCN to show details on hover.
	•	Filter menus should use Select components with subtle animations.
	•	Time range selectors (Daily, Weekly, Yearly) should be buttons in a segmented control with:

className="bg-muted text-sm px-3 py-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"



⸻

📁 Icons & Status Indicators
	•	Use lucide-react icons for tags, time filters, actions.
	•	Use tag chips (e.g., Hosting, Cloud) with:

<Badge variant="secondary" className="rounded-full text-xs" />



⸻

🎛️ Advanced Touches
	•	Add a Tabs component (e.g., Monthly / Yearly) from ShadCN.
	•	Integrate loading skeletons (<Skeleton className="h-4 w-2/3" />) for slow data loads.
	•	Add export buttons styled with Button variant="ghost" and a download icon.

⸻

✅ Summary

Stick to:
	•	Card-driven design
	•	Dark mode neutral tones with strong accents
	•	ShadCN UI primitives for layout, filters, tooltips
	•	Simple, clean, performant charts
	•	Responsive & accessible design
