# Welcome to the Project Documentation

This site provides automatically generated documentation for your Python project using Now T.

## 📄 Features

- Claude-based code documentation via `autodoc.py`
- Automated code review via `claude_folder_review.py`
- MkDocs-compatible structure
- GitHub Actions integration for CI/CD

## 🚀 How It Works

When you push your code:
- Code is scanned and documented
- Reviews are generated in Markdown
- Site is deployed via GitHub Pages

## 📂 Sections

- `docs/code/`: Auto-generated docstrings from code
- `output/reviews/`: Claude-based code review summaries

## 🛠️ Customization

You can tweak `nowt_config.yaml` to:
- Exclude specific files from review or docgen
- Change batch size for review
- Configure output paths

---

> 🧠 _Now T: your always-on AI doc assistant._