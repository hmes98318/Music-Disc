# i18n Directory Format Guidelines

## Introduction
Use **IETF Language Tags** for organizing and naming i18n (internationalization) files. Each language's translation files must be placed in a directory named according to the following format:

## Naming Rules

```
<language>-<region>
```

- **<language>**: A two-letter code defined by [ISO 639-1](https://en.wikipedia.org/wiki/ISO_639-1), representing the language. (Must be lowercase)
- **<region>**: A two-letter code defined by [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2), representing the country or region. (Must be uppercase)

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

