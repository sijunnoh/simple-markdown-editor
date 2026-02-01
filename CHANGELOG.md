# Changelog

All notable changes to Simple Markdown Editor will be documented in this file.

## [1.0.2] - 2026-02-01

### Fixed

- **Table IME Input**: Fixed Korean/Japanese/Chinese input in table cells not saving correctly
- **Table Save**: Fixed table content being lost when saving during IME composition
- **Mouse Event Error**: Fixed `relatedTarget?.closest is not a function` error on mouse leave

## [1.0.1] - 2026-02-01

### Fixed

- **Syntax Highlighting**: Improved code block colors for better visibility in light mode
- **Table Borders**: Enhanced table header and cell borders for better visibility
- **Image Paths**: Fixed image display for filenames with spaces

### Improved

- **README**: Added demo GIF and feature screenshots

## [1.0.0] - 2026-02-01

### Added

- **WYSIWYG Editor**: Rich text editing with TipTap/ProseMirror
- **Toolbar**: Full formatting toolbar with text styles, headings, lists, and media
- **View Modes**: Editor, Source, and Split view options
- **Text Formatting**: Bold, Italic, Strikethrough, Inline Code
- **Headings**: H1 through H5 support
- **Lists**: Bullet, Numbered, and interactive Task Lists
- **Code Blocks**: Syntax highlighting with language selector (20+ languages)
- **Links**: Insert/edit links with hover preview and URL autocomplete
- **Tables**: Insert and edit markdown tables with row/column controls
- **Images**:
  - Drag & drop from file system
  - Paste from clipboard with auto-save
  - Resize with drag handle
  - Edit/delete context menu
  - Responsive sizing (max-width: 100%)
- **Keyboard Shortcuts**: Standard formatting shortcuts (Cmd/Ctrl+B, I, K, etc.)
- **Input Rules**: Markdown-style shortcuts (# for headings, - for lists, etc.)
- **Hints Bar**: Quick reference for shortcuts and input rules
- **VS Code Theme Integration**: Adapts to light/dark themes
