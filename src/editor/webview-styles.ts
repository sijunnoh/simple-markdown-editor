/**
 * CSS styles for the webview editor.
 * Extracted from the inline <style> block in the HTML template.
 */
export const webviewStyles = `
    * { box-sizing: border-box; }
    body {
      padding: 0;
      margin: 0;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-font-family);
    }
    .simple-markdown-editor {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    /* Toolbar */
    .toolbar {
      position: relative;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 6px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background);
      top: 0;
      z-index: 10;
      flex-shrink: 0;
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
    }
    .toolbar::-webkit-scrollbar {
      height: 4px;
    }
    .toolbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .toolbar::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 2px;
    }
    .toolbar::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
    .toolbar-scroll {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .toolbar-spacer {
      flex: 1;
      min-width: 16px;
    }
    .toolbar .view-toggle {
      flex-shrink: 0;
      padding-left: 8px;
    }
    .toolbar button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
    }
    .toolbar button:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    .toolbar button.active {
      background: var(--vscode-toolbar-activeBackground, rgba(255,255,255,0.1));
      color: var(--vscode-textLink-foreground);
    }
    .toolbar .divider {
      width: 1px;
      height: 20px;
      background: var(--vscode-panel-border);
      margin: 0 6px;
      flex-shrink: 0;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .md-icon {
      font-size: 11px;
      font-weight: 700;
      line-height: 16px;
    }
    /* Search Panel */
    .search-panel {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .search-section {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }
    .search-panel .search-input {
      padding: 4px 8px;
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      width: 120px;
      min-width: 80px;
    }
    .search-panel .search-input:focus {
      border-color: var(--vscode-focusBorder);
    }
    .search-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 4px;
    }
    .search-nav-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    .search-nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .search-count {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      min-width: 60px;
      text-align: center;
    }
    .search-divider {
      width: 1px;
      height: 20px;
      background: var(--vscode-panel-border);
      margin: 0 4px;
    }
    .search-replace-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      background: var(--vscode-button-secondaryBackground, rgba(255,255,255,0.1));
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    }
    .search-replace-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground, rgba(255,255,255,0.15));
    }
    .search-replace-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .search-close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 4px;
      margin-left: auto;
    }
    .search-close-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    /* Search Highlighting */
    .search-highlight {
      background: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 179, 8, 0.4));
      border-radius: 2px;
      outline: 1px solid rgba(234, 179, 8, 0.5);
    }
    .search-highlight-current {
      background: var(--vscode-editor-findMatchBackground, rgba(234, 179, 8, 0.7));
      border-radius: 2px;
      outline: 2px solid var(--vscode-editor-findMatchBorder, rgb(234, 179, 8));
    }
    /* Editor Container */
    .editor-container {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .editor-pane, .source-pane {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .editor-pane.split, .source-pane.split {
      flex: 0 0 50%;
    }
    .editor-pane .tiptap {
      flex: 1;
    }
    .editor-bottom-area {
      min-height: 100px;
      flex-shrink: 0;
      cursor: text;
    }
    .source-pane {
      border-left: 1px solid var(--vscode-panel-border);
      position: relative;
      overflow: hidden;
    }
    .source-pane textarea {
      width: 100%;
      height: 100%;
      padding: 16px;
      border: none;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size, 14px);
      line-height: 1.6;
      resize: none;
      outline: none;
      position: relative;
      z-index: 2;
    }
    /* When highlight overlay is present, make textarea background transparent */
    .source-pane:has(.search-highlight-overlay) textarea {
      background: transparent;
      caret-color: var(--vscode-editor-foreground);
    }
    .search-highlight-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size, 14px);
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow-wrap: break-word;
      pointer-events: none;
      z-index: 1;
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
    }
    .search-highlight-overlay mark {
      color: inherit;
    }
    /* Split View Block Highlight */
    .split-highlight-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 16px;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size, 14px);
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
      pointer-events: none;
      color: transparent;
      background: var(--vscode-editor-background);
      overflow: hidden;
    }
    .split-highlight-line {
      background: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 179, 8, 0.15));
      border-radius: 2px;
      padding-right: 9999px;
      margin-right: -9999px;
    }
    .source-pane:has(.split-highlight-overlay) textarea {
      background: transparent;
      caret-color: var(--vscode-editor-foreground);
    }
    .ProseMirror > .split-highlight-block {
      background: var(--vscode-editor-findMatchHighlightBackground, rgba(234, 179, 8, 0.15));
      border-radius: 3px;
      transition: background 0.15s ease;
    }
    /* ProseMirror Editor */
    .ProseMirror {
      outline: none;
      min-height: 100%;
      padding: 16px;
    }
    .ProseMirror p {
      margin: 0 0 1em 0;
      min-height: 1.6em;
    }
    .ProseMirror p:empty::before {
      content: '';
      display: inline-block;
    }
    .ProseMirror p:last-child {
      margin-bottom: 0;
    }
    .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror h5 {
      margin: 1.5em 0 0.5em 0;
    }
    .ProseMirror h1:first-child, .ProseMirror h2:first-child, .ProseMirror h3:first-child,
    .ProseMirror h4:first-child, .ProseMirror h5:first-child {
      margin-top: 0;
    }
    .ProseMirror h1 { font-size: var(--heading-h1-size, 2em); font-weight: 600; margin-left: var(--heading-h1-indent, 0); }
    .ProseMirror h2 { font-size: var(--heading-h2-size, 1.5em); font-weight: 600; margin-left: var(--heading-h2-indent, 0); }
    .ProseMirror h3 { font-size: var(--heading-h3-size, 1.25em); font-weight: 600; margin-left: var(--heading-h3-indent, 0); }
    .ProseMirror h4 { font-size: var(--heading-h4-size, 1.1em); font-weight: 600; margin-left: var(--heading-h4-indent, 0); }
    .ProseMirror h5 { font-size: var(--heading-h5-size, 1.05em); font-weight: 600; margin-left: var(--heading-h5-indent, 0); }
    .ProseMirror ul, .ProseMirror ol {
      padding-left: 1.5em;
      margin: 0 0 1em 0;
    }
    .ProseMirror li {
      margin: 0.25em 0;
    }
    /* Task List */
    .ProseMirror ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    .ProseMirror ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .ProseMirror ul[data-type="taskList"] li > label {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      height: 1.6em;
    }
    .ProseMirror ul[data-type="taskList"] li > label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--vscode-textLink-foreground);
    }
    .ProseMirror ul[data-type="taskList"] li > label span {
      display: none;
    }
    .ProseMirror ul[data-type="taskList"] li > div {
      flex: 1;
    }
    .ProseMirror ul[data-type="taskList"] li > div p {
      margin: 0;
      line-height: 1.6em;
    }
    .ProseMirror ul[data-type="taskList"] li[data-checked="true"] > div {
      text-decoration: line-through;
      opacity: 0.6;
    }
    /* Table */
    .ProseMirror table {
      border-collapse: collapse;
      margin: 1em 0;
      width: 100% !important;
      min-width: 100% !important;
      table-layout: fixed;
    }
    .ProseMirror table colgroup {
      display: none;
    }
    .ProseMirror th,
    .ProseMirror td {
      border: 1px solid var(--vscode-foreground, #888);
      padding: 8px 12px;
      text-align: left;
      vertical-align: top;
      width: auto !important;
      min-width: auto !important;
    }
    .ProseMirror th {
      background: var(--vscode-textCodeBlock-background);
      font-weight: 600;
    }
    .ProseMirror td {
      background: var(--vscode-editor-background);
    }
    .ProseMirror tr:first-child th {
      border-bottom: 2px solid var(--vscode-foreground);
    }
    .ProseMirror .tableWrapper {
      position: relative;
      margin: 1em 0;
      overflow-x: auto;
    }
    .ProseMirror .tableWrapper:has(.selectedCell) table,
    .ProseMirror .tableWrapper:focus-within table {
      outline: 2px solid var(--vscode-textLink-foreground);
      outline-offset: 2px;
    }
    .ProseMirror th.selectedCell,
    .ProseMirror td.selectedCell {
      background: var(--vscode-editor-selectionBackground);
    }
    .ProseMirror th p,
    .ProseMirror td p {
      margin: 0;
    }
    .ProseMirror code {
      background: var(--vscode-textCodeBlock-background);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.9em;
    }
    .ProseMirror pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px 16px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1em 0;
    }
    .ProseMirror pre code {
      background: none;
      padding: 0;
      font-size: 0.9em;
    }
    /* Code block with language selector */
    .code-block {
      position: relative;
      margin: 1em 0;
      background: var(--vscode-textCodeBlock-background);
      border-radius: 6px;
    }
    .code-block select {
      position: absolute;
      top: 6px;
      right: 6px;
      padding: 2px 8px;
      font-size: 11px;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
      border-radius: 4px;
      cursor: pointer;
      outline: none;
      z-index: 10;
    }
    .code-block select:hover {
      background: var(--vscode-dropdown-listBackground);
    }
    .code-block select:focus {
      border-color: var(--vscode-focusBorder);
    }
    .code-block pre {
      margin: 0;
      padding: 32px 16px 12px 16px;
      background: transparent !important;
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size, 14px);
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .code-block pre code {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      background: none;
      padding: 0;
      color: var(--vscode-editor-foreground);
    }
    /* Syntax highlighting */
    .code-block pre code .hljs-comment,
    .code-block pre code .hljs-quote { color: #6a737d; font-style: italic; }
    .code-block pre code .hljs-variable,
    .code-block pre code .hljs-template-variable,
    .code-block pre code .hljs-attribute,
    .code-block pre code .hljs-tag,
    .code-block pre code .hljs-regexp,
    .code-block pre code .hljs-link,
    .code-block pre code .hljs-selector-id,
    .code-block pre code .hljs-selector-class { color: #e45649; }
    .code-block pre code .hljs-number,
    .code-block pre code .hljs-meta,
    .code-block pre code .hljs-built_in,
    .code-block pre code .hljs-builtin-name,
    .code-block pre code .hljs-literal,
    .code-block pre code .hljs-type,
    .code-block pre code .hljs-params { color: #c18401; }
    .code-block pre code .hljs-string,
    .code-block pre code .hljs-symbol,
    .code-block pre code .hljs-bullet { color: #50a14f; }
    .code-block pre code .hljs-title,
    .code-block pre code .hljs-section { color: #c18401; }
    .code-block pre code .hljs-keyword,
    .code-block pre code .hljs-selector-tag { color: #a626a4; }
    .code-block pre code .hljs-emphasis { font-style: italic; }
    .code-block pre code .hljs-strong { font-weight: 700; }
    .code-block pre code .hljs-name { color: #e45649; }
    .code-block pre code .hljs-attr { color: #986801; }
    .code-block pre code .hljs-property { color: #4078f2; }
    .code-block pre code .hljs-function { color: #4078f2; }
    .code-block pre code .hljs-addition { color: #50a14f; background: rgba(80, 161, 79, 0.1); }
    .code-block pre code .hljs-deletion { color: #e45649; background: rgba(228, 86, 73, 0.1); }
    .ProseMirror blockquote {
      border-left: 3px solid var(--vscode-textBlockQuote-border);
      margin: 1em 0;
      padding-left: 1em;
      color: var(--vscode-textBlockQuote-foreground);
    }
    .ProseMirror a {
      color: var(--vscode-textLink-foreground);
      text-decoration: underline;
    }
    .ProseMirror a:hover {
      color: var(--vscode-textLink-activeForeground);
    }
    .ProseMirror hr {
      border: none;
      border-top: 1px solid var(--vscode-panel-border);
      margin: 2em 0;
    }
    .ProseMirror strong,
    .ProseMirror li strong,
    .ProseMirror td strong,
    .ProseMirror th strong { font-weight: 900; }
    .ProseMirror em { font-style: italic; }
    .ProseMirror s { text-decoration: line-through; }
    .ProseMirror img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 1em 0;
    }
    /* Image Resizing */
    .image-view {
      display: block;
      margin: 1em 0;
      line-height: 0;
      overflow: visible;
      width: fit-content;
      max-width: 100%;
    }
    .image-view.selected .image-container {
      outline: 2px solid var(--vscode-textLink-foreground);
    }
    .image-container {
      position: relative;
      display: block;
      overflow: visible;
      width: fit-content;
      max-width: 100%;
    }
    .resize-handle {
      position: absolute;
      right: 4px;
      bottom: 4px;
      width: 16px;
      height: 16px;
      background: var(--vscode-textLink-foreground);
      border: 2px solid var(--vscode-editor-background);
      border-radius: 3px;
      cursor: nwse-resize;
      z-index: 20;
      opacity: 0.9;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .resize-handle::before {
      content: '';
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 6px;
      height: 6px;
      border-right: 2px solid var(--vscode-editor-background);
      border-bottom: 2px solid var(--vscode-editor-background);
    }
    .resize-handle:hover, .resize-handle.resizing {
      transform: scale(1.15);
      opacity: 1;
    }
    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .modal {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-panel-border);
      border-radius: 8px;
      min-width: 360px;
      max-width: 480px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .modal-title {
      font-weight: 600;
      font-size: 14px;
    }
    .modal-close {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 4px;
    }
    .modal-close:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    .modal-body {
      padding: 16px;
    }
    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .modal-form label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .modal-form label span {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .modal-form input {
      padding: 8px 10px;
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 44px;
      font-size: 13px;
      outline: none;
    }
    .modal-form input:focus {
      border-color: var(--vscode-focusBorder);
    }
    .modal-form select {
      padding: 8px 32px 8px 10px;
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 10px center;
    }
    .modal-form select:focus {
      border-color: var(--vscode-focusBorder);
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }
    .modal-btn-primary, .modal-btn-secondary, .modal-btn-danger {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
    }
    .modal-btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .modal-btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .modal-btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }
    .modal-btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .modal-btn-danger {
      background: transparent;
      color: var(--vscode-errorForeground);
      margin-right: auto;
    }
    .modal-btn-danger:hover {
      background: rgba(255, 0, 0, 0.1);
    }
    /* Link Hover Popup */
    .link-hover-popup {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      z-index: 50;
      max-width: 400px;
    }
    .link-hover-url {
      font-size: 12px;
      color: var(--vscode-textLink-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }
    .link-hover-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border: none;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      border-radius: 4px;
      opacity: 0.7;
    }
    .link-hover-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
      opacity: 1;
    }
    /* Hints Bar */
    .hints-bar {
      position: relative;
      overflow: hidden;
      padding: 6px 12px;
      background: var(--vscode-editorWidget-background);
      border-top: 1px solid var(--vscode-panel-border);
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }
    .hints-bar.two-rows {
      padding: 4px 0;
    }
    .hints-row {
      display: flex;
      align-items: center;
      padding: 2px 0;
    }
    .hints-label {
      flex-shrink: 0;
      width: 40px;
      padding-left: 8px;
      font-size: 9px;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
    }
    .hints-track {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding: 2px 12px 2px 0;
      scrollbar-width: thin;
      scrollbar-color: var(--vscode-scrollbarSlider-background) transparent;
    }
    .hints-track::-webkit-scrollbar {
      height: 3px;
    }
    .hints-track::-webkit-scrollbar-track {
      background: transparent;
    }
    .hints-track::-webkit-scrollbar-thumb {
      background: var(--vscode-scrollbarSlider-background);
      border-radius: 2px;
    }
    .hints-track::-webkit-scrollbar-thumb:hover {
      background: var(--vscode-scrollbarSlider-hoverBackground);
    }
    .hint-item {
      display: flex;
      align-items: center;
      gap: 4px;
      white-space: nowrap;
    }
    .hint-item.highlight {
      background: var(--vscode-button-background);
      padding: 2px 8px;
      border-radius: 4px;
    }
    .hint-item.highlight .hint-key {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: var(--vscode-button-foreground);
    }
    .hint-item.highlight .hint-desc {
      color: var(--vscode-button-foreground);
      font-weight: 500;
    }
    .hint-key {
      padding: 2px 6px;
      background: var(--vscode-keybindingLabel-background, rgba(128, 128, 128, 0.2));
      border: 1px solid var(--vscode-keybindingLabel-border, rgba(128, 128, 128, 0.4));
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family);
      font-size: 10px;
      color: var(--vscode-keybindingLabel-foreground, var(--vscode-foreground));
    }
    .hint-desc {
      color: var(--vscode-descriptionForeground);
    }
    /* Suggestions Menu */
    .suggestions-menu {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      padding: 4px;
      min-width: 200px;
      max-height: 300px;
      overflow-y: auto;
    }
    .suggestion-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }
    .suggestion-item:hover, .suggestion-item.active {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-list-hoverForeground);
    }
    .suggestion-icon {
      display: flex;
      align-items: center;
      opacity: 0.7;
    }
    .suggestion-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Image Hover Popup */
    .image-hover-popup {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 4px;
      padding: 4px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 12px;
    }
    .image-hover-info {
      color: var(--vscode-descriptionForeground);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* Image Edit Menu */
    .image-edit-menu {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 4px;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 4px;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10;
    }
    .image-edit-btn {
      background: transparent;
      border: none;
      color: var(--vscode-foreground);
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
    }
    .image-edit-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    /* Table Floating Menu */
    .table-floating-menu {
      display: flex;
      gap: 4px;
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-editorWidget-border, var(--vscode-panel-border));
      border-radius: 4px;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10;
    }
    .table-menu-btn {
      background: transparent;
      border: none;
      color: var(--vscode-errorForeground);
      padding: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
    }
    .table-menu-btn:hover {
      background: rgba(255, 0, 0, 0.1);
    }
    /* Table Context Menu */
    .table-context-menu-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 99;
    }
    .table-context-menu {
      background: var(--vscode-menu-background);
      border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      padding: 4px;
      min-width: 180px;
      z-index: 100;
    }
    .table-context-menu button {
      display: block;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: var(--vscode-menu-foreground);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
      border-radius: 4px;
    }
    .table-context-menu button:hover {
      background: var(--vscode-menu-selectionBackground);
      color: var(--vscode-menu-selectionForeground);
    }
    .table-context-menu button.danger {
      color: var(--vscode-errorForeground);
    }
    .table-context-menu button.danger:hover {
      background: var(--vscode-errorForeground);
      color: white;
    }
    .context-menu-divider {
      height: 1px;
      background: var(--vscode-menu-separatorBackground, var(--vscode-panel-border));
      margin: 4px 0;
    }
    /* Settings Toggle */
    .settings-toggle {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .settings-toggle > span {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }
    .toggle-buttons {
      display: flex;
      gap: 8px;
    }
    .toggle-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--vscode-input-border, var(--vscode-panel-border));
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      font-size: 13px;
      font-family: var(--vscode-editor-font-family);
      cursor: pointer;
      transition: all 0.15s;
    }
    .toggle-btn:hover {
      background: var(--vscode-list-hoverBackground);
    }
    .toggle-btn.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }
`;
