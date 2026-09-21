declare namespace JSX {
  interface IntrinsicElements { [elementName: string]: any }
}

declare module 'react' {
  export type ReactNode = any
  export function createContext<T>(defaultValue: T): any
  export function useContext(context: any): any
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useMemo<T>(factory: () => T, deps: any[]): T
  export function useState<T>(initial: T): [T, (value: T) => void]
  export const StrictMode: any
}

declare module 'react-dom/client' {
  export function createRoot(element: Element): { render(node: any): void }
}

declare module 'react/jsx-runtime' {
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}
