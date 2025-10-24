# Project Dependencies and Versions

## Runtime and Framework Versions
- Node.js: v22.21.0 (engines: `^18.20.2 || >=20.9.0`)
- Next.js: 15.4.4
- React: 19.1.0
- React DOM: 19.1.0
- Payload CMS: 3.61.0

## App Dependencies (`dependencies`)
- @payloadcms/next: 3.61.0
- @payloadcms/payload-cloud: 3.61.0
- @payloadcms/richtext-lexical: 3.61.0
- @payloadcms/ui: 3.61.0
- @payloadcms/db-postgres: 3.61.0
- cross-env: ^7.0.3
- dotenv: 16.4.7
- graphql: ^16.8.1
- next: 15.4.4
- payload: 3.61.0
- react: 19.1.0
- react-dom: 19.1.0
- sharp: 0.34.2

## Dev Dependencies (`devDependencies`)
- @playwright/test: 1.54.1
- @testing-library/react: 16.3.0
- @types/node: ^22.5.4
- @types/react: 19.1.8
- @types/react-dom: 19.1.6
- @vitejs/plugin-react: 4.5.2
- eslint: ^9.16.0
- eslint-config-next: 15.4.4
- jsdom: 26.1.0
- playwright: 1.54.1
- playwright-core: 1.54.1
- prettier: ^3.4.2
- typescript: 5.7.3
- vite-tsconfig-paths: 5.1.4
- vitest: 3.2.3

## Package Manager
- Preferred: pnpm (engines: `^9 || ^10`)
- Current usage: npm (Corepack activation of pnpm was restricted)

## Notes
- The runtime Node version is detected from the local environment and may differ from the `engines` specification. Ensure compatibility with Payload and Next.js by using a supported Node version (LTS recommended).
- Versions listed are pinned from `package.json` at the time of writing.