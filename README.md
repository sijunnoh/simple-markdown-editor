# Simple Markdown Editor

A rich WYSIWYG Markdown editor for VS Code with a modern toolbar interface.

## Features

### WYSIWYG Editing
Edit Markdown files visually with real-time formatting. No need to memorize syntax.

### Toolbar
Full-featured toolbar with quick access to:
- **Text formatting**: Bold, Italic, Strikethrough, Inline Code
- **Headings**: H1 through H5
- **Lists**: Bullet, Numbered, and Task Lists
- **Blocks**: Blockquote, Code Block
- **Media**: Links and Images

### View Modes
- **Editor**: WYSIWYG editing mode
- **Source**: Raw Markdown source editing
- **Split**: Side-by-side editor and source view

### Code Blocks
Syntax highlighting for 20+ programming languages with a language selector dropdown.

### Task Lists
Interactive checkboxes for task lists. Click to toggle completion.

### Images
- Drag & drop images from your file system
- Paste images from clipboard (auto-saved to workspace)
- Resize images by dragging the corner handle
- Edit or delete images via context menu

### Links
- Insert links via toolbar or keyboard shortcut
- Hover to preview URL with open/edit options
- File path autocomplete when typing

### Tables
- Insert tables via toolbar
- Edit row/column count
- Selection outline when editing
- Delete table option

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + B` | Bold |
| `Cmd/Ctrl + I` | Italic |
| `Cmd/Ctrl + Shift + S` | Strikethrough |
| `Cmd/Ctrl + E` | Inline Code |
| `Cmd/Ctrl + K` | Insert Link |
| `Cmd/Ctrl + Z` | Undo |
| `Cmd/Ctrl + Shift + Z` | Redo |

## Input Rules

Type these patterns followed by a space to quickly format:

| Pattern | Result |
|---------|--------|
| `# ` | Heading 1 |
| `## ` | Heading 2 |
| `### ` | Heading 3 |
| `- ` | Bullet list |
| `1. ` | Numbered list |
| `[] ` | Task list |
| `> ` | Blockquote |
| ``` ` `` ``` | Code block |
| `---` | Horizontal rule |

## Requirements

- VS Code 1.108.1 or higher

## License

MIT
