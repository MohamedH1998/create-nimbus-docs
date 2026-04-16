import pluginJavaScript from "@eslint/js";
import pluginTypeScript from "typescript-eslint";
import globals from "globals";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ["dist/", "node_modules/", "template/", ".tmp-cloudflare-smoke*/"],
	},
	{
		languageOptions: {
			globals: {
				...globals.node,
			},
			parserOptions: {
				tsconfigRootDir: ROOT_DIR,
			},
		},
	},
	pluginJavaScript.configs.recommended,
	...pluginTypeScript.configs.recommended,
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
];
