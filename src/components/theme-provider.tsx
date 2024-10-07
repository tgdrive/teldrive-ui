import { createContext, useContext, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

import { useIsFirstRender } from "@/hooks/use-first-render";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  colorScheme: ColorScheme;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setColorScheme: (colorScheme: ColorScheme) => void;
};

export const defaultColorScheme: ColorScheme = {
  color: "#82b1ff",
};

const initialState: ThemeProviderState = {
  colorScheme: defaultColorScheme,
  theme: "system",
  setTheme: () => null,
  setColorScheme: () => null,
};

type ColorScheme = {
  color: string;
  cssVars?: Record<string, string>;
};

const sheet = new CSSStyleSheet();

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const firstRender = useIsFirstRender();

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>(
    "colorScheme",
    defaultColorScheme,
  );

  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (colorScheme.cssVars && firstRender) {
      for (const key in colorScheme.cssVars) {
        sheet.insertRule(`${key}{${colorScheme.cssVars[key]}}`);
      }

      document.adoptedStyleSheets = [sheet];
    }
  }, [colorScheme.color, firstRender]);

  const value = {
    theme,
    setTheme,
    colorScheme,
    setColorScheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
