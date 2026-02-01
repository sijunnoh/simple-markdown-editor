# Welcome to Simple Markdown Editor

A **rich WYSIWYG** editor for VS Code with _real-time_ formatting and intuitive toolbar.

---

## Text Formatting

You can easily apply **bold**, _italic_, strikethrough, and `inline code` styles.

Combine them together: **_bold italic_**, _strikethrough italic_, `bold code`

## Headings

This editor supports H1 through H5 headings. Use the toolbar dropdown or type `#` symbols.

## Lists

### Bullet List

- First item
- Second item
  - Nested item
  - Another nested

- Third item

### Numbered List

1.  Step one
2.  Step two
3.  Step three

### Task List

- [x] Create WYSIWYG editor
- [x] Add toolbar with formatting options
- [x] Support tables and code blocks
- [ ] Publish to VS Code Marketplace

## Code Blocks

Supports 20+ languages with syntax highlighting:

```typescript
interface User {
	name: string;
	email: string;
}

function greet(user: User): string {
	return `Hello, ${user.name}!`;
}
```

```python
def fibonacci(n: int) -> list[int]:
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib[:n]

```

## Tables

| Shortcut     | Action | Description        |
| ------------ | ------ | ------------------ |
| Cmd/Ctrl + B | Bold   | Toggle bold text   |
| Cmd/Ctrl + I | Italic | Toggle italic text |
| Cmd/Ctrl + K | Link   | Insert/edit link   |
| Cmd/Ctrl + E | Code   | Toggle inline code |
| Cmd/Ctrl + Z | Undo   | Undo last action   |

## Links & Images

Visit the [VS Code Marketplace](https://marketplace.visualstudio.com/) to discover more extensions.

Images can be added via toolbar or drag & drop, with resize support.

## Blockquote

> **Pro Tip:** Toggle between WYSIWYG, Source, and Split view using the toolbar buttons on the right!

---

Enjoy writing with **Simple Markdown Editor**!
