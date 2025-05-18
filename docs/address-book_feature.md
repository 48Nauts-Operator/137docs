Excellent idea — adding an Address Book module to your document management system not only improves automation but also enables smart lookups, tagging, and pre-filling forms. It’s especially valuable for invoice processing, communication tracking, and entity recognition in LLM tasks.

Here’s how you can structure and implement it:

⸻

📇 Address Book Feature Overview

🔍 Purpose

Automatically extract sender and recipient contact details from scanned documents and:
	•	Build a structured address book (people + organizations)
	•	Link documents (invoices, reminders, letters) to those entities
	•	Enable filtering and analytics by sender/company
	•	Power LLM features like: “Show all unpaid invoices from [Company]”

⸻

🧾 Data Extraction Flow
	1.	During OCR parsing, detect:
	•	Company name
	•	Full address (including country)
	•	Email addresses
	•	Phone numbers
	•	VAT or Tax IDs
	•	IBAN / banking details (optional, secure flag)
	2.	Compare against existing address book entries:
	•	If similar match: attach
	•	If new: create a new entry
	3.	Manually editable via UI (optional override or tagging)

⸻

🧱 Suggested Address Book Schema

Field	Description
Entity ID	UUID or unique hash
Type	Person / Company / Government
Name	Full name or business name
Email	One or more addresses
Phone	Optional contact number
Address	Full mailing address
Country	ISO 2-letter code (e.g. DE, CH, US)
VAT ID	Tax number (if present)
Bank Details	IBAN, BIC (encrypted if needed)
Tags	e.g., Hosting, Law, Tax Advisor
Created From	Source document link or filename
Documents	Array of related doc IDs
Last Seen In	Date of most recent document


⸻

🔗 How It Connects
	•	Invoices: Each invoice links to a sender in the address book
	•	Timeline: Clicking a sender shows historical document flow
	•	Analytics: Track monthly spend by vendor
	•	Tasks: “Remind me to contact [Lawyer Name]” — resolved via entity match

⸻

🖥️ UI Recommendations

Add a new menu item: 📒 Address Book
	•	Table View: Company Name, Type, Documents Linked, Last Seen
	•	Detail View:
	•	Header: Entity info + logo (if available)
	•	Tabs: Details | Documents | Notes
	•	Search + Filter: Company name, tag, country, doc count

⸻

🤖 Bonus: AI Enhancements
	•	Suggest merging similar contacts (via LLM or fuzzy match)
	•	Auto-tag company category: SaaS, Legal, Cloud
	•	Validate address format using country-specific logic

