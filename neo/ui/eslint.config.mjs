import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	// Disable slop/inner-html rule which doesn't exist in config
	{ rules: { "slop/inner-html": "off" } },
	// Disable react-hooks/refs for rrweb integration
	{ rules: { "react-hooks/refs": "off" } },
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
	]),
]);

export default eslintConfig;
