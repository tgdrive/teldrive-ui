import { memo, useCallback, useEffect, useState } from "react";
import { Button } from "@tw-material/react";
import { genThemeConfig } from "@tw-material/theme/config";
import BxReset from "~icons/bx/reset";
import clsx from "clsx";

import { useIsFirstRender } from "@/hooks/use-first-render";
import { ColorPickerMenu } from "@/components/menus/color-picker";
import { defaultColorScheme, useTheme } from "@/components/theme-provider";

const swatches = [
  "#ff8a80",
  "#ff80ab",
  "#ea80fc",
  "#b388ff",
  "#8c9eff",
  "#82b1ff",
  "#80d8ff",
  "#84ffff",
  "#a7ffeb",
  "#b9f6ca",
  "#ccff90",
  "#f4ff81",
  "#ffff8d",
  "#ffe57f",
  "#ffd180",
  "#ff9e80",
  "#d7ccc8",
  "#f5f5f5",
  "#cfd8dc",
];

export const ApperanceTab = memo(() => {
  const { colorScheme, setColorScheme } = useTheme();

  const [color, setColor] = useState(colorScheme.color);

  const firstRender = useIsFirstRender();

  useEffect(() => {
    if (color === colorScheme.color || firstRender) {
      return;
    }
    const config = genThemeConfig({
      sourceColor: color,
      customColors: [],
    });
    const cssVars = {};
    const sheet = new CSSStyleSheet();
    for (const key in config.utilities) {
      const value = Object.entries(config.utilities[key]).reduce(
        (acc, val) => `${acc}${val[0]}:${val[1]};`,
        "",
      );
      cssVars[key] = value;
    }

    for (const key in cssVars) {
      sheet.insertRule(`${key}{${cssVars[key]}}`);
    }
    setColorScheme({ cssVars, color });

    document.adoptedStyleSheets = [sheet];
  }, [color, firstRender, colorScheme.color, setColorScheme]);

  const handleReset = useCallback(() => {
    setColor(defaultColorScheme.color);
    setColorScheme({ cssVars: {}, color: defaultColorScheme.color });
    document.adoptedStyleSheets = [];
  }, [setColorScheme]);

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div>
          <p className="text-lg font-medium">Color</p>
          <p className="text-sm font-normal text-on-surface-variant">Change primary Color</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {swatches.map((swatchColor) => (
            <div
              key={swatchColor}
              style={{ backgroundColor: swatchColor }}
              onClick={() => setColor(swatchColor)}
              className={clsx(
                "size-8 rounded-full hover:ring-4 cursor-pointer transition-all",
                color === swatchColor ? "ring-4 ring-primary" : "ring-outline-variant",
              )}
              title={swatchColor}
            />
          ))}
          <ColorPickerMenu color={color} setColor={setColor} />
          <Button
            title="Reset Color"
            variant="filled"
            isIconOnly
            className="min-w-8 size-8"
            onPress={handleReset}
          >
            <BxReset />
          </Button>
        </div>
      </div>
    </div>
  );
});
