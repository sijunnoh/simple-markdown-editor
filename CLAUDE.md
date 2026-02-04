# Simple Markdown Editor

## Project Overview

- **Name**: simple-markdown-editor
- **Type**: VS Code Extension
- **Purpose**: Rich Markdown editor with toolbar
- **Style**: WYSIWYG + Toolbar (with source view toggle)
- **Version**: 1.0.9

## Tech Stack

### Core

- Extension: TypeScript
- Bundling: esbuild
- Webview UI: React + TypeScript

### Editor Library: TipTap

- ProseMirror-based WYSIWYG editor
- React/TypeScript support
- WYSIWYG ↔ Markdown toggle via turndown/marked

## Project Structure

```plaintext
simple-markdown-editor/
├── src/
│   ├── extension.ts                    # Extension entry
│   ├── editor/
│   │   └── markdown-editor-provider.ts # Custom editor provider
│   ├── webview/
│   │   ├── index.tsx                   # Webview entry
│   │   └── app.tsx                     # Main React app
│   └── test/
├── package.json
├── esbuild.js
└── tsconfig.json

```

## Commands

```bash
# Development
npm run watch          # Watch mode
npm run compile        # Build

# Testing
npm run test           # Run tests

# Packaging
npm run package        # Production build

# Publishing
vsce package           # Create .vsix file

```

## Implemented Features

### Editor

- [x] WYSIWYG editing with TipTap
- [x] Source view (raw Markdown)
- [x] Split view (editor + source)
- [x] VS Code theme integration

### Toolbar

- [x] Text formatting (Bold, Italic, Strikethrough, Code)
- [x] Headings (H1-H5)
- [x] Lists (Bullet, Numbered, Task)
- [x] Blockquote
- [x] Code blocks with syntax highlighting
- [x] Links with hover preview
- [x] Images with drag & drop
- [x] Tables

### Advanced Features

- [x] Image resize with drag handle
- [x] Image edit/delete floating menu
- [x] Table delete floating menu
- [x] Code block language selector (20+ languages)
- [x] Keyboard shortcuts (Cmd/Ctrl+B, I, / for Format Menu)
- [x] Markdown input rules (# for headings, - for lists, etc.)
- [x] Hints bar for shortcuts reference
- [x] Title bar button to open with WYSIWYG editor

## Keyboard Shortcuts

| Shortcut             | Action      |
| -------------------- | ----------- |
| Cmd/Ctrl + B         | Bold        |
| Cmd/Ctrl + I         | Italic      |
| Cmd/Ctrl + /         | Format Menu |
| Cmd/Ctrl + Z         | Undo        |
| Cmd/Ctrl + Shift + Z | Redo        |

## Publishing Checklist

- [x] LICENSE file (MIT)
- [x] .vscodeignore
- [x] CHANGELOG.md
- [x] README.md
- [x] icon.png (128x128 recommended)
- [x] Publisher ID in package.json (mech2cs)
- [x] Repository URL in package.json
