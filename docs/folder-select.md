Task: Add Folder Selection to the Settings Page

📋 Objective:

Enable users to select and configure where their Inbox and Storage Root (for archive folders) are located on their filesystem or NAS.

⸻

🧠 Responsibilities

You are responsible for modifying the Settings page so that users can:
	1.	Choose the Inbox folder path
	2.	Choose the Storage Root directory, which contains:
	•	Current year
	•	Last year
	•	Previous year
	•	Archive folder
	3.	Ensure that the selected folders are:
	•	Persisted to the app’s settings config
	•	Available to the document processor at runtime
	•	Validated for existence and permissions

⸻

🧩 Data Model

Store the following in the app config (settings.json, SQLite, or similar):

{
  "inbox_path": "/mnt/nas/Documents/Inbox",
  "storage_root": "/mnt/nas/Documents",
  "folders": {
    "2025": "/mnt/nas/Documents/2025",
    "2024": "/mnt/nas/Documents/2024",
    "2023": "/mnt/nas/Documents/2023",
    "archive": "/mnt/nas/Documents/Archive"
  }
}


⸻

🧑‍🎨 UI Implementation

In the Settings Page:

Section: Folder Configuration
	1.	Inbox Path
	•	Label: “Select your Inbox folder”
	•	Use native file picker
	•	Show currently selected path
	•	Validate on select
	2.	Storage Root Directory
	•	Label: “Select your Storage Root”
	•	Automatically manage /2025, /2024, /2023, /Archive
	•	Display subfolder paths
	•	Create folders if they don’t exist

⸻

🔄 Sync Behavior

When settings are updated:
	•	Update internal references used by ColPali ingestion and storage system
	•	Reload folder watchers with the new paths
	•	Migrate any pending files if needed

⸻

✅ Validation Rules
	•	Ensure folder is readable and writable
	•	Warn if path doesn’t exist or is a file
	•	Auto-create subfolders under storage root if missing:

mkdir -p /selected_root/2025 /selected_root/2024 /selected_root/2023 /selected_root/Archive



⸻

🧪 Testing Tasks
	•	Select valid folders and confirm they persist
	•	Update settings and confirm the document pipeline is using them
	•	Try to pick an invalid folder → should show error
	•	Ensure ColPali agent picks up documents from new Inbox path

⸻

📎 Example Visual (Optional)

[ Folder Configuration ]
----------------------------
Inbox Path:       [ /mnt/nas/Documents/Inbox      ]  [Browse]
Storage Root:     [ /mnt/nas/Documents            ]  [Browse]

Managed Folders:
• 2025       → /mnt/nas/Documents/2025
• 2024       → /mnt/nas/Documents/2024
• 2023       → /mnt/nas/Documents/2023
• Archive    → /mnt/nas/Documents/Archive


⸻

🤖 Agent Summary

As the Settings Agent, your task is to:
	•	Add UI components for folder path selection
	•	Store those values in persistent settings
	•	Ensure downstream processors use the updated paths
	•	Validate and create folders as needed

Is that clear? Do you have any questions? If not lets create a Sprint Plan and get started.