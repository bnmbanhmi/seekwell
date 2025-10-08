// Type override for i18next compatibility with TypeScript 4.9.5
declare module 'i18next' {
  interface TFunction {
    (key: string, options?: any): string;
    (key: string, defaultValue?: string, options?: any): string;
  }
}

// Extend the existing module types
declare module 'react-i18next' {
  export function useTranslation(ns?: string): {
    t: (key: string, options?: any) => string;
    i18n: any;
    ready: boolean;
  };
}