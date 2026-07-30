## Design System Structure

This document outlines the design system structure of the KendraFabric project, providing key information for integrating Figma designs using the Model Context Protocol (MCP).

### 1. Token Definitions

*   **Where are design tokens defined?**
    Design tokens are primarily defined in `design-tokens.tokens.json` at the project root. This file serves as the single source of truth for design values.

*   **What format/structure is used for tokens?**
    The tokens are defined in a JSON format compatible with [Style Dictionary](https://amzn.github.io/style-dictionary/). It includes definitions for colors (e.g., `color.white`, `color.gray.25`, `color.brand.500`), and potentially other properties like typography and spacing.

    ```json
    // design-tokens.tokens.json (truncated example)
    {"color":{"white":{"description":"","type":"color","value":"#ffffffff","blendMode":"normal"},"black":{"description":"","type":"color","value":"#000000ff","blendMode":"normal"},"gray":{"25":{"description":"","type":"color","value":"#fdfdfdff","blendMode":"normal"}, ... }
    ```

*   **Are there any token transformation systems in place?**
    Yes, the `packages/ui` package uses `style-dictionary` for token transformation. The configuration file `packages/ui/style-dictionary.config.js` specifies how tokens are processed and outputted for different platforms:
    *   **CSS:** Generates CSS variables into `src/styles/tokens.css`.
    *   **JavaScript:** Generates JavaScript modules (`tokens.js`) and TypeScript declarations (`tokens.d.ts`) into `src/tokens/`.

    ```javascript
    // packages/ui/style-dictionary.config.js
    export default {
      source: ['../../design-tokens.tokens.json'],
      platforms: {
        css: {
          transformGroup: 'css',
          buildPath: 'src/styles/',
          files: [{ destination: 'tokens.css', format: 'css/variables' }],
        },
        js: {
          transformGroup: 'js',
          buildPath: 'src/tokens/',
          files: [
            { destination: 'tokens.js', format: 'javascript/module' },
            { destination: 'tokens.d.ts', format: 'typescript/module-declarations' },
          ],
        },
      },
    };
    ```

### 2. Component Library

*   **Where are UI components defined?**
    UI components are primarily defined within the `packages/ui/src/components` directory. This package acts as the project's shared component library.

*   **What component architecture is used?**
    Components are organized into logical subdirectories (e.g., `ui` for general UI elements, `core` for more specific components). Many components appear to be built on top of [Radix UI primitives](https://www.radix-ui.com/), as indicated by dependencies in `packages/ui/package.json` and the structure of story files (e.g., `accordion.stories.tsx`, `dialog.stories.tsx`).

*   **Are there any component documentation or storybooks?**
    Yes, there is a [Storybook](https://storybook.js.org/) setup. The `packages/ui/package.json` includes `storybook` and `build-storybook` scripts. Component stories are located alongside their respective components, typically named `*.stories.tsx` (e.g., `packages/ui/src/components/ui/button.stories.tsx`).

### 3. Frameworks & Libraries

*   **What UI frameworks are used?**
    *   **Frontend Application (`apps/frontend`):** React 19.
    *   **Component Library (`packages/ui`):** React 19, utilizing Radix UI primitives.

*   **What styling libraries/frameworks are used?**
    *   **Tailwind CSS:** Used across the project for utility-first styling.
    *   **PostCSS:** Used for processing CSS, indicated by `packages/ui/postcss.config.cjs`.

*   **What build system and bundler are used?**
    *   **Frontend Application (`apps/frontend`):** [Vite](https://vitejs.dev/) (as per `apps/frontend/package.json`).
    *   **Component Library (`packages/ui`):** [`tsup`](https://tsup.js.org/) for building the library (as per `packages/ui/package.json`).
    *   **Monorepo Tooling:** [NPM Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) manage the overall project structure and dependencies.

### 4. Asset Management

*   **How are assets (images, videos, etc.) stored and referenced?**
    No explicit dedicated asset directories were identified (`public` or `assets` folders within `apps/frontend` or `packages/ui`). This suggests assets might be:
    *   Imported directly into components (e.g., SVG as React components).
    *   Located within component-specific directories.
    *   The public folders might be named differently, or assets are served from a different location not immediately apparent from the codebase.

*   **What asset optimization techniques are used?**
    No specific asset optimization tools were identified in `package.json` files or build scripts. Optimization might be handled implicitly by the build tools (Vite for frontend, tsup for UI library) or through manual processes.

*   **Are there any CDN configurations?**
    No CDN configurations were identified in the provided `package.json` files or `docker-compose.yml`.

### 5. Icon System

*   **Where are icons stored?**
    Icons are primarily sourced from the `lucide-react` library.

*   **How are icons imported and used in components?**
    Icons are imported as named React components from `lucide-react` and used directly within JSX.

    ```typescript
    // Example usage
    import { ChevronRight, Menu } from 'lucide-react';

    function Header() {
      return (
        <nav>
          <Menu className="h-6 w-6" />
          <ChevronRight className="h-4 w-4" />
        </nav>
      );
    }
    ```

*   **Is there an icon naming convention?**
    The icon naming convention follows `lucide-react`'s established patterns (e.g., PascalCase for component names like `ChevronRight`, `Menu`).

### 6. Styling Approach

*   **What CSS methodology is used?**
    **Tailwind CSS** is the primary styling methodology, promoting a utility-first approach. It is configured via `postcss.config.cjs` in `packages/ui`.
    ```javascript
    // packages/ui/postcss.config.cjs
    module.exports = {
      plugins: {
        tailwindcss: {},
        autoprefixer: {},
      },
    }
    ```
    While `tailwind.config.cjs` was not directly located in `apps/frontend` or `packages/ui` during the direct search, its presence in `postcss.config.cjs` confirms its active use. It's likely that a shared or inherited Tailwind configuration is in place, possibly at the monorepo root or managed through the workspace setup.

*   **Are there global styles?**
    No explicit global style files (like `index.css` or `globals.css` with `@import` statements) were found during the search in `apps/frontend/src` or `packages/ui/src`. This suggests that global styles are minimal and primarily handled by Tailwind's base styles and utility classes, or that the main CSS entry point needs further investigation.

*   **How are responsive designs implemented?**
    Responsive designs are implemented using **Tailwind CSS's responsive utility variants**. Breakpoints are configured within the Tailwind configuration (likely in the `tailwind.config.cjs` file, even if its exact location wasn't immediately identified).

### 7. Project Structure

*   **What is the overall organization of the codebase?**
    The project is a **monorepo** managed by **NPM Workspaces**. The top-level `package.json` defines `workspaces` including:
    *   `apps/*`: Contains individual applications.
        *   `apps/frontend`: The main React frontend application.
        *   `apps/backend`: The Node.js/Express backend API.
        *   `apps/agent-engine`: A Python-based agent engine (likely FastAPI).
        *   `apps/mcp-servers`: Microservices for different communication platforms.
        *   `apps/model_registry_backend`: Backend for model registry.
    *   `packages/*`: Contains shared libraries or components.
        *   `packages/shared`: Likely for common types, interfaces, utility functions, etc., shared across applications.
        *   `packages/ui`: The dedicated shared UI component library.
    *   `kendradocs`: The Docusaurus-based documentation site.

*   **Are there any specific patterns for feature organization?**
    *   **Applications:** Each application (`apps/frontend`, `apps/backend`, etc.) maintains its own `src` directory, `package.json`, and specific configurations, promoting modularity.
    *   **UI Components:** The `packages/ui` follows a component-driven development approach, with components and their Storybook stories co-located (e.g., `packages/ui/src/components/ui/Button.tsx` and `packages/ui/src/components/ui/Button.stories.tsx`). This facilitates easy discoverability and testing of individual UI elements.
    *   **Shared Utilities:** `packages/shared` serves as a central place for reusable code that doesn't belong to a specific application or UI component.
