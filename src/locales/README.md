# i18n Directory Format Guidelines

## Contributing

We welcome contributions to help improve and expand our i18n files. If you would like to contribute, please follow these guidelines:

1. **Fork the Repository:** Fork the repository to your own GitHub account. Make sure your fork is based on the latest **dev** branch.
2. **Create a New Branch:** Create a new branch from the **dev** branch in your fork for your changes. Use a descriptive branch name.
3. **Follow the Guidelines:** Ensure your changes adhere to the naming rules and directory structure outlined below.
4. **Submit a Pull Request:** When your changes are ready, submit a pull request (PR) from your branch in your fork to the **dev** branch of the main repository. Include a clear description of your changes and reference any related issues.
5. **Review Process:** Your PR will be reviewed by the maintainers. Be responsive to feedback and requests for modifications.

---

## Naming Rules

Use **IETF Language Tags** for organizing and naming i18n (internationalization) files. Each language's translation files must be placed in a directory named according to the following format:

```
<language>-<region>
```

- **<language>**: A two-letter code defined by [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1), representing the language. (Must be lowercase)
- **<region>**: A two-letter code defined by [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2), representing the country or region. (Must be uppercase)

## Important Warning

**Do not delete the `en-US` directory.**  
The `en-US` directory serves as the default template language. It is used to check for missing translation keys in other languages and automatically add them if necessary. Deleting this directory will disrupt this automated process and lead to incomplete or missing translations in the application.

---

## Examples of Valid Directory Names

| Directory Name | Description                             |
|----------------|-----------------------------------------|
| `en-US`        | English (United States)                |
| `zh-TW`        | Chinese (Traditional, Taiwan)          |
| `zh-CN`        | Chinese (Simplified, China)            |
| `fr-FR`        | French (France)                        |
| `es-MX`        | Spanish (Mexico)                       |
| `ja-JP`        | Japanese (Japan)                       |
| `de-DE`        | German (Germany)                       |

---

## Implementation Example
Here is how you can structure your i18n directories:

```
/locales
  ├── en-US
  │     ├── commands.json
  │     ├── embeds.json
  │     └── events.json
  ├── zh-TW
  │     ├── commands.json
  │     ├── embeds.json
  │     └── events.json
  ├── fr-FR
        ├── commands.json
        ├── embeds.json
        └── events.json
```

Each directory contains the translation files (`.json`) for the corresponding language and region.

---

## References
- [IETF Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
- [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1)
- [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)

