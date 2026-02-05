# Changelog

All notable changes to Simple Markdown Editor will be documented in this file.

## [1.2.3] - 2026-02-06

### Fixed

- **Split View Highlight**: Fixed highlight sync for loose lists (lists with blank lines between items)
  - Bullet list items separated by blank lines are now correctly consumed as a single list block
  - Added look-ahead logic that skips blank lines when the same list type continues
  - Type-aware matching prevents crossing list types (bullet vs ordered) across blank lines

## [1.2.2] - 2026-02-06

### Fixed

- **Explorer Context Menu**: Fixed "Open with Simple Markdown Editor" not working when the file is not actively selected in the explorer (now uses the right-clicked file URI directly)

## [1.2.1] - 2026-02-05

### Fixed

- **Split View Highlight**: Fixed highlight sync breaking on markdown with inline badge images (`[![badge](img)](link)`) and HTML heading tags (`<h1>`)
  - Inline images extracted as block by TipTap no longer cause subsequent blocks to map to wrong lines
  - Added phantom image detection via inline image reference counting
  - Added paragraph fragment grouping for split paragraph nodes
  - Added guard for documents where ProseMirror nodes outnumber markdown blocks

## [1.2.0] - 2026-02-05

### Added

- **Split View Block Highlight**: Clicking a block in the WYSIWYG editor highlights the corresponding lines in source view, and vice versa
- **Explorer Context Menu**: Right-click any `.md` file in the explorer to "Open with Simple Markdown Editor"

## [1.1.2] - 2026-02-05

### Improved

- **Toolbar Layout**: Right-side buttons (view toggle, search, settings) now align to the right edge when space allows, scroll together when space is limited

## [1.1.1] - 2026-02-05

### Fixed

- **Find & Replace**: Fixed scroll not following when navigating to matches outside viewport

## [1.1.0] - 2026-02-05

### Added

- **Find & Replace**: Full-featured search and replace functionality
  - Search with match highlighting in both Editor and Source views
  - Navigate between matches with Previous/Next buttons
  - Replace current match or Replace All
  - Match count display (e.g., "3/15")
  - Keyboard shortcuts: `Cmd/Ctrl+F` to open, `Enter` for next, `Shift+Enter` for previous, `Escape` to close
  - Toolbar button with toggle behavior
  - Automatic view detection in Split view (searches the focused pane)

### Improved

- **Toolbar**: Horizontal scroll for narrow viewports (all buttons scroll together)
- **Search Panel**: Responsive layout with flex-wrap for narrow widths

## [1.0.13] - 2026-02-05

### Improved

- **README**: Updated demo GIF

## [1.0.12] - 2026-02-04

### Fixed

- **Settings Persistence**: Fixed dual storage issue (localStorage removed, globalState only)

## [1.0.11] - 2026-02-04

### Added

- **Settings Modal**: New settings panel accessible from toolbar
  - **Heading Size**: Choose between Small, Medium, or Large heading sizes
  - **Indentation Style**: Choose between Tabs, 2 Spaces, or 4 Spaces for list indentation
  - **Image Directory**: Select preset or custom directory for saved images
  - **Markdown Style**: Choose italic (`*` vs `_`) and bold (`**` vs `__`) delimiters
- **Settings Persistence**: Settings saved in VS Code globalState (persists across sessions)

### Fixed

- **Heading 5 Size**: Fixed H5 being same size as body text (now slightly larger)

### Improved

- **Image Directory UI**: Dropdown with presets + custom option instead of plain text input

## [1.0.10] - 2026-02-04

### Improved

- **README**: Updated screenshots

## [1.0.9] - 2026-02-04

### Improved

- **README**: Added "How to Open" section with instructions for opening the editor

## [1.0.8] - 2026-02-02

### Improved

- **VS Code Compatibility**: Lowered minimum VS Code version from 1.108.1 to 1.75.0 for wider compatibility

## [1.0.7] - 2026-02-02

### Fixed

- **Task List Checkbox**: Fixed checkboxes (`[x]`, `[ ]`) being lost when saving task lists
- **List Item Spacing**: Fixed extra blank lines being added between list items

### Improved

- **List Formatting**: Consistent single space after list markers (`- item` instead of `-   item`)
- **Nested List Indent**: Consistent 2-space indentation for nested lists

## [1.0.6] - 2026-02-02

### Added

- **Title Bar Button**: Click the button in the editor title bar to quickly open markdown files with WYSIWYG editor
- **Optional Editor**: Changed to optional editor (use "Open With..." or title bar button to open with WYSIWYG)

### Fixed

- **Table Cell Formatting**: Fixed bold, italic, code, strikethrough, and links being lost in table cells on save
- **Split View Cursor**: Fixed cursor jumping to end of document when saving in split view
- **Split View Scroll**: Fixed markdown textarea scroll position resetting on save
- **Save Flickering**: Fixed content flickering with old content during save

### Improved

- **Source View Hints Bar**: Split into 2 rows (Text/Block) to prevent horizontal scrollbar

## [1.0.5] - 2026-02-02

### Added

- **Format Menu**: Press `Cmd/Ctrl + /` to open a quick-pick menu with all formatting options
  - Text formatting: Bold, Italic, Strikethrough, Inline Code
  - Media: Link, Image, Table
  - Headings: H1, H2, H3
  - Lists: Bullet, Numbered, Task
  - Blocks: Blockquote, Code Block

## [1.0.4] - 2026-02-01

### Fixed

- **Save Indicator Bug**: Fixed unsaved indicator (white dot) not disappearing after save
- **Horizontal Rule Conversion**: Fixed `---` being converted to `***` on save
- **Bullet List Conversion**: Fixed `-` bullets being converted to `*` on save

### Improved

- **Edit Synchronization**: Only send edits to VS Code when content actually changes

## [1.0.3] - 2026-02-01

### Added

- **Table Context Menu**: Right-click on table cells to access table operations
  - Insert row above/below
  - Insert column left/right
  - Delete row/column
  - Delete table

### Improved

- **Table Header Styling**: First row always styled as header, even after deleting original header row
- **Context Menu UX**: Menu closes on outside click instead of mouse leave
- **Menu Positioning**: Context menu stays visible near viewport edges

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
