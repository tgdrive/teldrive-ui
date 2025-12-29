import { createContext, useContext, useEffect, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { genThemeConfig } from "@tw-material/theme/config";

type Theme = "dark" | "light" | "system";

type ColorScheme = {
  color: string;
  cssVars?: Record<string, string>;
};

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

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const sheet = new CSSStyleSheet();

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
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

  // Handle Dynamic Theme Generation & Caching
  useEffect(() => {
    if (!colorScheme.color) return;

    // Apply cached CSS if available to avoid regeneration on every reload
    if (colorScheme.cssVars) {
      const rules = Object.entries(colorScheme.cssVars).map(([key, val]) => `${key}{${val}}`);
      sheet.replaceSync(rules.join("\n"));
      if (!document.adoptedStyleSheets.includes(sheet)) {
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
      return;
    }

    // Otherwise generate new theme config
    const config = genThemeConfig({
      sourceColor: colorScheme.color,
      customColors: [],
    });

    const cssVars: Record<string, string> = {};
    const rules: string[] = [];
    for (const key in config.utilities) {
      const value = Object.entries(config.utilities[key]).reduce(
        (acc, val) => `${acc}${val[0]}:${val[1]};`,
        "",
      );
      cssVars[key] = value;
      rules.push(`${key}{${value}}`);
    }

    sheet.replaceSync(rules.join("\n"));

    if (!document.adoptedStyleSheets.includes(sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }

    // Persist the generated vars so they can be reused on next reload
    setColorScheme({ color: colorScheme.color, cssVars });
  }, [colorScheme.color, colorScheme.cssVars, setColorScheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      colorScheme,
      setColorScheme,
    }),
    [theme, setTheme, colorScheme, setColorScheme],
  );

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
