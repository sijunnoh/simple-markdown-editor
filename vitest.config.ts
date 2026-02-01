import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		// Only include webview utils tests, exclude VS Code extension tests
		include: ["src/webview/**/*.test.ts"],
		exclude: ["src/test/**", "node_modules/**"],
	},
});
