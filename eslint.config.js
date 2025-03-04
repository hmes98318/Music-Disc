import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: [
            ".github/",
            "dist/",
            "node_modules/",
            "public/",
            "server/",
            "views/",
            "*.d.ts"
        ]
    },
    {
        files: ["**/*.{js,mjs,cjs,ts}"]
    },
    {
        languageOptions: { globals: globals.browser }
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^(_|error)$",
                    caughtErrorsIgnorePattern: "^(_|error)$"
                }
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "no-async-promise-executor": "off",
            "semi": "error",
            "no-console": "off",
            "no-empty": "off",
            "no-constant-condition": "off",
            "no-useless-escape": "off"
        }
    }
];