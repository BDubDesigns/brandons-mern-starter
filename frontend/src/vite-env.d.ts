/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
// This file is used to provide TypeScript with type definitions for the Vite environment variables.
// It ensures that when you access `import.meta.env.VITE_API_URL`, TypeScript knows that it is a string
//  and provides type checking and autocompletion in the IDE.
