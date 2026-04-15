import pluginJavaScript from "@eslint/js";
import pluginTypeScript from "typescript-eslint";
import pluginAstro from "eslint-plugin-astro";
import tsParser from "@typescript-eslint/parser";

import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	pluginJavaScript.configs.recommended,
	...pluginTypeScript.configs.recommended,
	...pluginAstro.configs.recommended,
	{
		ignores: [".astro/", "dist/"],
	},
	// Ensure Astro frontmatter is parsed as TypeScript
	{
		files: ["**/*.astro"],
		languageOptions: {
			parserOptions: {
				parser: tsParser,
			},
		},
	},
	{
		rules: {
			"no-var": "error",
			"no-empty": ["error", { allowEmptyCatch: true }],
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-empty-object-type": [
				"error",
				{ allowInterfaces: "with-single-extends" },
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					ignoreRestSiblings: true,
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
					destructuredArrayIgnorePattern: "^_",
				},
			],
		},
	},
	// Astro-generated type declarations
	{
		files: ["src/env.d.ts"],
		rules: {
			"@typescript-eslint/triple-slash-reference": "off",
		},
	},
];
