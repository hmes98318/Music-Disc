# TypeScript Coding Style

Apply these rules in the project unless that project's active TypeScript or ESLint configuration requires a stricter rule. For style cases not covered here, follow the [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html).

## Formatting and source files

- Use UTF-8 source files, four-space indentation, and semicolons.
- Use blank lines to separate import groups, related declarations, class members, and logical blocks. Avoid blank lines at the beginning or end of a short function.
- Preserve the quote style of the surrounding file. When creating a new file, prefer single-quoted strings; use double quotes when they improve readability or match an external string format.
- Break long function calls, object literals, conditional expressions, and type declarations across lines with one logical unit per line. Keep short, clear expressions on one line.
- Do not make formatting-only changes to unrelated code.

## Project structure and modules

- Organize files by responsibility: public entry points, stateful domain classes, queues or collections, REST or transport clients, external integrations, utilities, and shared type definitions.
- Keep one primary class or focused utility per file. Place helpers next to the feature they support instead of creating broad catch-all modules.
- Put externally consumed data contracts in dedicated type files such as `Name.types.ts`; provide a central type-only barrel when it improves public consumption.
- Use relative, extensionless paths for local imports.
- Order imports in groups separated by blank lines:
  1. External runtime imports.
  2. Local runtime imports.
  3. Type-only imports using `import type`.
- Default-export the principal runtime class of a module. Use named exports for enums, constants, helper functions, secondary classes, and public API re-exports.
- Export only symbols that are part of the intended module or package API.

## Naming

- Use `PascalCase` for classes, enums, interfaces, and type aliases.
- Use `camelCase` for functions, methods, variables, parameters, object properties, and class fields.
- Use `UPPER_SNAKE_CASE` for exported protocol or module constants and uppercase static fields representing fixed class-level values.
- Use descriptive, domain-specific names. Short names such as `i`, `it`, `res`, or `err` are acceptable only in a small local scope.
- Name types after their role, including `FooOptions`, `FooResult`, `FooEvents`, `FooState`, `FooError`, and `FooPayload`.
- For external API or serialized schemas, use the established `I` prefix when it keeps those contracts distinct, for example `ITrack` or `ISpotifyTrack`. Do not add an `I` prefix to ordinary domain types merely because they are interfaces.
- Preserve names required by external protocols and APIs exactly, including `snake_case` fields.

## TypeScript types and state

- Keep strict TypeScript checking enabled. Model data explicitly with `type` aliases and interfaces, and use literal unions or discriminated unions for finite states and payload variants.
- Use `interface` for public or extendable object contracts, and `type` aliases for unions, intersections, mapped or conditional types, and internal object shapes that do not require extension.
- Use `T[]` for simple arrays. Use `Array<T>` when the element type is a union or another complex type and the generic syntax improves readability.
- Use `import type` for symbols used only as types.
- Prefer `unknown` for untrusted external data, then narrow it with runtime checks, type guards, `instanceof`, or `typeof`. Use `any` only at a narrow interoperability boundary that cannot be typed safely.
- Prefer object-literal annotations over `as` assertions. Use assertions only when a runtime check or a local invariant makes them safe; document non-obvious assertions.
- Avoid non-null assertions. Use control-flow narrowing, optional chaining, or an explicit guard unless the invariant is already guaranteed.
- Mark stable fields `readonly`. Use explicit `public`, `private`, or `protected` modifiers where visibility communicates the intended API.
- Use `null` for an intentional empty value in a public or runtime state, and `undefined` for omitted optional values. Use `??` for defaults and `?.` for optional access.

## Classes and APIs

- Use classes for stateful clients, models, queues, controllers, and source integrations. Keep their public methods focused on the feature's responsibilities.
- Define public state and public methods deliberately. Keep implementation details private.
- Validate public constructor options with a focused static validation method such as `checkOptions` before assigning state.
- Use getters for derived state that reads like a property, such as a queue size, duration, active settings, or resolved identifier.
- Use enums for closed runtime states and modes. Name enum members in `UPPER_SNAKE_CASE` when they represent protocol-like values or discrete modes.
- Type events as a map from event name to listener signature, then use generic overload-compatible methods to preserve event payload types.

## Functions and control flow

- Use `const` by default; use `let` only when the binding is reassigned. Never use `var`.
- Add explicit parameter and return types to public APIs, non-obvious callbacks, type guards, and complex asynchronous methods. Allow inference for straightforward local values and simple private helpers.
- Use `async` and `await` for asynchronous flows. Return `Promise<T>` when the result is part of an API contract.
- Prefer early returns and guards to reduce indentation. Check invalid or unsupported input before executing the main path.
- Use `switch` for protocol operations, enum values, and finite discriminated cases. Enclose each `case` body in braces and include a `default` branch when unknown input must be reported or rejected.
- Use `for...of` for arrays, maps, and other iterables. Use `Object.entries()` or `Object.keys()` for object iteration rather than unfiltered `for...in`.
- Use `===` and `!==`. A loose null comparison is acceptable only when deliberately treating `null` and `undefined` as the same absence value.
- Use optional chaining for optional dependencies or values, and use nullish coalescing instead of `||` when valid falsey values must be preserved.

## Validation and errors

- Validate types and required values at public boundaries. Throw `TypeError` for invalid types or missing required input, and `RangeError` for invalid indexes or numeric bounds.
- Return `null`, `false`, or an explicit error result when that is part of the method's documented normal outcome; throw errors for invalid state or failed operations that callers must handle.
- Make error messages actionable: identify the invalid value, failed operation, remote service, or relevant identifier.
- At external boundaries, preserve useful error context while translating failures into the application's error or result model.
- Use `try`/`catch` only around operations that can fail and can be handled meaningfully. Name intentionally unused caught errors with a leading underscore where lint rules require it.

## Documentation and comments

- Document public classes, constructors, methods, getters, and non-obvious fields with JSDoc.
- Start method documentation with a verb phrase that describes the behavior. Document constraints, side effects, defaults, asynchronous behavior, errors, and return values when they are not clear from the signature.
- Use typed JSDoc tags for public APIs when the surrounding code uses them, for example `@param {Type} name - Description`. Document nested option properties when they are important to callers.
- Use `//` comments for implementation rationale, external protocol behavior, compatibility constraints, and intentionally unusual logic.
- Do not add comments that merely repeat an identifier, a type, or obvious control flow.
