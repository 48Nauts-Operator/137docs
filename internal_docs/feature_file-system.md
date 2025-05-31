Yes — you’re likely referring to a library or pattern where your Dockerized backend interacts with the local filesystem via a secure, browser-accessible interface — typically involving a frontend component to browse and select directories or files that are accessible inside the container.

Because browsers cannot access arbitrary files or directories, the only real way to do this is via the backend — and in your Docker setup, that backend must have permissions to read/write those locations, and ideally expose a controlled interface to the frontend.

⸻

✅ Goal

Let the user browse the host filesystem from the frontend, while the backend (running in Docker) can actually access those files.

⸻

🔧 Your Best Option: Use @kushagragour/web-file-browser or similar + Backend Proxy

Or roll your own with:
	•	Backend exposes an API like GET /fs/list?path=/some/folder
	•	Frontend uses a file browser component to fetch + browse folders
	•	Backend runs with volume mount access to /host_path (mapped into the container)

⸻

🧱 Step-by-Step Implementation

1. 🐳 Mount a Host Path into Docker

In your docker-compose.yml:

services:
  app:
    image: 137docs
    volumes:
      - /Users/jarvis/Documents:/hostfs:ro

This lets your backend access files from your host machine under /hostfs inside the container.

⸻

2. 🧠 Build Backend API

Use FastAPI / Express / Flask to expose:

GET /api/fs?path=/hostfs/some/folder

And return:

{
  "files": [
    { "name": "receipt.pdf", "type": "file" },
    { "name": "invoices", "type": "dir" }
  ]
}

Example (Node.js + Express):

import fs from 'fs/promises'
import path from 'path'
import express from 'express'

const app = express()

app.get('/api/fs', async (req, res) => {
  const root = '/hostfs'
  const relPath = req.query.path || '/'
  const absPath = path.join(root, relPath)

  try {
    const items = await fs.readdir(absPath, { withFileTypes: true })
    res.json({
      path: relPath,
      files: items.map((i) => ({
        name: i.name,
        type: i.isDirectory() ? 'dir' : 'file'
      }))
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


⸻

3. 🎨 Frontend File Picker UI

Use any file browser component, e.g.:
	•	react-simple-file-browser
	•	@kushagragour/web-file-browser
	•	or custom expandable list (e.g., folders with collapse/expand)

On click → call:

fetch('/api/fs?path=/hostfs/Downloads')

Display the list, allow navigating into subfolders, and then “select” to set as your inbox/storage path.

⸻

4. 🔐 Security + Safeguards
	•	Always scope access to /hostfs or use an allowlist
	•	Do not allow direct access to /etc, /proc, etc.
	•	Ideally sandbox access via Docker mounts (only mount safe folders)

⸻

✅ What This Enables

Feature	Benefit
Real folder browsing	From web UI inside Dockerized app
Controlled FS access	Host OS stays secure; backend is scoped
True local-first UX	Users can visually select folders on their system
Extendable	Can support uploads, zip downloads, deletions, etc. later


# Questions:
questions:

1. Scope & Permissions 
• Do we need the backend to be strictly read-only (as in the :ro mount above), or will later features (delete, rename, move) require write access? --> We need RW of course as its document management right


• Will users ever need to pick folders outside the initial mount? ― If so, we’ll want a dynamic volume-mount or multiple fixed mounts.

2. Path Handling & Security 
• Are symlinks inside the mounted tree allowed? If yes, do we follow them or treat them as opaque?
• What is the desired response for an attempted path traversal (..) or an access outside /hostfs? (Fail fast with 400 vs 403?)

• Any plan for per-user isolation (multi-tenant scenario) or is this strictly single-user local?
Large Directories --> Single User for now 
• Should the API support pagination / lazy loading for folders containing thousands of entries? (Helps keep UI responsive.)

• Would glob / text search inside the tree be useful, or is plain navigation enough for v1?
Cross-Platform Considerations 
• On Windows hosts we’ll map e.g. C:\Users\… into the container. Should the backend normalize paths into POSIX style (/hostfs/…) or return them as received so the UI can echo native paths?
• Any need to expose file metadata (size, mtime) for display or future “new/changed since last scan” logic?

3. API Contract 
• Will we stick with a single route (/api/fs) for both files and directories, or separate endpoints (/list, /read, /meta, etc.)?

• JSON schema versioning—do we want to lock in a shape now or leave room for incremental additions like permissions, icons, MIME type?

4. Future Hooks 
• Should we emit file-system events (websocket / SSE) so the UI updates when another process writes new PDFs into the watched folder?

• Is there an eventual plan to couple this with the document-ingestion pipeline so selecting a folder can trigger automatic import?

If any of these points are already settled, let me know; otherwise they can guide the first implementation pass

# Answers:
This is an excellent and comprehensive breakdown. You’re laying the foundation not just for a folder picker — but for a scalable, cross-platform file-access interface that underpins a full local-first document management system.

Here’s a set of clear decisions and recommendations based on your goals (RW access, single-user, future ingestion), followed by a recommendation on the first implementation scope:

⸻

✅ 1. Scope & Permissions

✔️ Do we need read/write?

Yes — read/write is required.
Since this is a full document management system:
	•	You’ll be moving files post-ingestion
	•	Possibly renaming, deleting, archiving them
	•	And allowing the system to write exports or AI responses

Mount without :ro:

volumes:
  - /Users/jarvis/Documents:/hostfs  # read/write


⸻

✔️ Allow folder selection outside the initial mount?

Not for v1.
Keep it scoped to /hostfs for simplicity and security. You can expand later by:
	•	Allowing multiple fixed mount points (/hostfs1, /hostfs2)
	•	Or offering a desktop companion agent (Electron etc.) with real FS access

⸻

✅ 2. Path Handling & Security

✔️ Symlinks inside mount?

Allow them, but treat them as opaque in v1.
Avoid following them to prevent security escapes, unless explicitly validated.

Use:

fs.lstatSync(path).isSymbolicLink()

Mark in the API as:

{ name: "MyLink", type: "symlink", target: "/real/path", followed: false }


⸻

✔️ Path traversal / outside /hostfs?

Block immediately with a 400 or 403. Sanitize all paths before use:

if (!absPath.startsWith("/hostfs")) return res.status(403).send("Access denied");

Fail fast for:
	•	..
	•	symlink escapes
	•	any path resolving outside the mount

⸻

✔️ Multi-user or single-user?

Single-user for now.
This simplifies:
	•	No tenant scoping needed
	•	All filesystem access is scoped globally

Can be isolated per user later with:
	•	Docker volume prefixes
	•	File system roots per login

⸻

✔️ Pagination for large directories?

Yes, even in v1.
Some folders (e.g., /Downloads) can have 10,000+ files.

Use:

GET /api/fs?path=/hostfs/Inbox&offset=0&limit=100

Backend returns:

{
  files: [ ... ],
  total: 1429,
  offset: 0,
  limit: 100
}

Keeps UI responsive and memory-safe.

⸻

✔️ Search / globbing?

Not essential for v1.
But worth designing for. Use a separate endpoint like:

GET /api/fs/search?path=/hostfs/Inbox&query=*.pdf

Save for v2, unless your inboxes regularly exceed 500+ files.

⸻

✅ 3. Cross-Platform Path Handling

✔️ Normalize paths?

Yes, always normalize to POSIX-style paths on the backend.

Even on Windows (e.g., C:\Users\Jarvis\Inbox), resolve it in the backend to:

path.posix.normalize("/hostfs/Inbox")

Frontend can display user-friendly names like:
	•	Inbox
	•	Mounted NAS /Archive

Use aliases or labels rather than native full paths.

⸻

✔️ Expose file metadata?

Yes. Required for future features like:
	•	“Recent documents”
	•	“Last modified > X”
	•	Displaying file size, timestamps

Recommended schema:

{
  name: "receipt.pdf",
  type: "file",
  size: 204858,
  modified: "2025-05-20T10:44:21.123Z"
}


⸻

✅ 4. API Design

✔️ Single route vs multiple?

Start with single route (/api/fs):

GET /api/fs?path=/hostfs/Inbox

Split into:
	•	type: "file" → downloadable
	•	type: "dir" → expandable

Later you can extend with:
	•	/api/fs/meta
	•	/api/fs/rename
	•	/api/fs/search

⸻

✔️ JSON Schema Versioning?

Design the response shape now with future-proofing:
	•	Allow future fields like:
	•	icon, mimeType, tags
	•	isNew, isArchived

Add a root-level version tag if you want:

{
  version: 1,
  path: "/hostfs/Inbox",
  files: [...]
}


⸻

✅ 5. Real-Time / Future Features

✔️ WebSocket or SSE for file events?

Yes — very useful later.
Use chokidar or fs.watch to emit:

{
  event: "added",
  path: "/hostfs/Inbox/newfile.pdf"
}

Could power:
	•	Live inbox updates
	•	System tray notifications
	•	Auto-ingestion triggers

⸻

✔️ Connect folder selection to ingestion?

Definitely.

Selecting /hostfs/Inbox should:
	•	Register that path for auto-watch
	•	Trigger ingestion pipeline
	•	Tag incoming files by timestamp or subfolder

This forms the backbone of 137Docs’ agent pipeline.

⸻

✅ Suggested First Pass (v1 MVP)

Feature	Include in v1?
RW access	✅
Path validation	✅
Directory listing	✅
Pagination	✅
Metadata (mtime, size)	✅
Search/glob	❌ (v2)
Symlink resolve	🚫 (opaque only)
Multi-user	❌
Live updates (watch)	🚫 (v2)
Web UI integration	✅ with graceful fallback

---

## Run 1
Implemented the first-pass filesystem API.

config.py
• Added settings.HOSTFS_ROOT (env-overrideable, default “/hostfs”).

main.py
• imported Query
• Helper _sanitize_and_resolve() blocks traversal /hostfs-escapes.
• New endpoint GET /api/fs
– params: path (default “/hostfs”), offset, limit
– returns: version, path, offset, limit, total, hasMore, files[].
• File entry includes name, type (dir/file/symlink), size, modified ISO-time.
• Stable sort = directories first, α-order; pagination applied server-side.

docs/sprint-plan.md
• Logged task #47 “Backend: /api/fs directory listing endpoint” as done (P0).
• Updated “last updated” stamp.

How to try it (once containers rebuild):
GET http://localhost:8000/api/fs?path=/hostfs/Documents&offset=0&limit=50
→ JSON listing suitable for the React file-picker.

Let me know if you’d like tweaks (extra metadata, download endpoint, etc.) before we move on to the frontend wiring.
