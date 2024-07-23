import typescriptEslint from '@typescript-eslint/eslint-plugin';
import promise from 'eslint-plugin-promise';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );
const compat = new FlatCompat( {
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
} );

export default [ ...compat.extends(
	'wikimedia/jquery',
	'wikimedia/mediawiki',
	'wikimedia/mocha',
	'wikimedia/server',
	'plugin:promise/recommended',
), {
	ignores: [
		'src/**/*.json',
	],

	languageOptions: {
		parser: tsParser,
		ecmaVersion: 5,
		sourceType: 'module',
	},

	plugins: {
		'@typescript-eslint': typescriptEslint,
		promise,
	},

	rules: {
		'compat/compat': 'off',
		'eqeqeq': 'off',
		'es-x/no-optional-catch-binding': 'off',
		'es-x/no-optional-chaining': 'off',
		'es-x/no-symbol-prototype-description': 'off',
		'jsdoc/require-param': 'off',
		'jsdoc/require-param-type': 'off',
		'jsdoc/require-returns': 'off',
		'max-len': 'off',
		'no-case-declarations': 'off',
		'no-console': 'off',
		'no-jquery/no-class-state': 'off',
		'no-jquery/no-global-selector': 'off',
		'no-jquery/no-grep': 'off',
		'no-jquery/no-in-array': 'off',
		'no-jquery/no-map-util': 'off',
		'no-jquery/no-sizzle': 'off',
		'no-jquery/variable-pattern': 'off',
		'no-loop-func': 'off',
		'no-multi-str': 'off',
		'no-prototype-builtins': 'off',
		'no-shadow': 'off',
		'no-undef': 'off',
		'no-underscore-dangle': 'off',
		'no-unreachable-loop': 'off',
		'n/no-missing-import': 'off',
		'n/no-missing-require': 'off',
		'promise/catch-or-return': 'off',
		'security/detect-non-literal-regexp': 'off',
		'security/detect-non-literal-require': 'off',
		'security/detect-possible-timing-attacks': 'off',
		'security/detect-unsafe-regex': 'off',
		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': [ 'error' ],
	},

	settings: {
		node: {
			resolvePaths: [ 'node_modules/@types' ],
			tryExtensions: [ '.js', '.ts', '.d.ts' ],
		},
	},
} ];
