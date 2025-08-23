# LESCO Bill Viewer

This application fetches and displays LESCO electricity bills for a specific home connection.

## Features

- Fetches LESCO bill information
- Displays bill in a clean, readable format
- Responsive design for all devices

## Development

### Getting Started

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

### How It Works

The application makes requests to the LESCO API to fetch bill information. During development, a proxy is configured in `vite.config.ts` to avoid CORS issues.

## Deployment

### Deploying to Vercel

This application is ready to be deployed to Vercel. The CORS issues that occur in development have been resolved through a serverless function proxy.

To deploy:

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and create a new project
3. Connect your GitHub repository
4. Vercel will automatically detect the Vite project and configure the build settings
5. Deploy the project

The application includes a serverless function (`api/lesco-proxy.js`) that acts as a proxy for API requests to LESCO, resolving CORS issues in production.

### How CORS is Resolved

In development, Vite's built-in proxy handles API requests. In production on Vercel, a serverless function (`api/lesco-proxy.js`) serves the same purpose by:
1. Receiving requests to `/api/lesco/*`
2. Forwarding them to the actual LESCO API
3. Returning the response to the client

This approach eliminates CORS issues because the browser is making requests to the same domain.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
