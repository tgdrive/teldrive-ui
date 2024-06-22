import { memo, useCallback, useEffect, useState } from "react"
import { Button } from "@tw-material/react"
import { genThemeConfig } from "@tw-material/theme/config"
import BxReset from "~icons/bx/reset"
import clsx from "clsx"

import { useIsFirstRender } from "@/hooks/useFirstRender"
import { ColorPickerMenu } from "@/components/menus/ColorPicker"
import { defaultColorScheme, useTheme } from "@/components/ThemeProvider"

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
]

export const ApperanceTab = memo(() => {
  const { colorScheme, setColorScheme } = useTheme()

  const [color, setColor] = useState(colorScheme.color)

  const firstRender = useIsFirstRender()

  useEffect(() => {
    if (color == colorScheme.color || firstRender) {
      return
    }
    const config = genThemeConfig({
      sourceColor: color,
      customColors: [],
    })
    const cssVars = {}
    const sheet = new CSSStyleSheet()
    for (const key in config.utilities) {
      const value = Object.entries(config.utilities[key]).reduce(
        (acc, val) => `${acc}${val[0]}:${val[1]};`,
        ""
      )
      cssVars[key] = value
    }

    for (const key in cssVars) sheet.insertRule(`${key}{${cssVars[key]}}`)
    setColorScheme({ cssVars, color })

    document.adoptedStyleSheets = [sheet]
  }, [color, firstRender])

  const handleReset = useCallback(() => {
    setColorScheme({ cssVars: {}, color: defaultColorScheme.color })
    document.adoptedStyleSheets = []
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-6 gap-2 py-2 w-full">
        <div className="col-span-6 xs:col-span-3">
          <p className="text-lg font-medium">Color</p>
          <p className="text-sm font-normal text-on-surface-variant">
            Change primary Color
          </p>
        </div>
        <div className="gap-2 grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] col-span-6 xs:col-span-3">
          {swatches.map((color) => (
            <div
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => setColor(color)}
              className={clsx(
                "size-8 rounded-full hover:ring-4 cursor-pointer",
                color === colorScheme.color && "ring-4 ring-primary"
              )}
            />
          ))}
          <ColorPickerMenu color={color} setColor={setColor} />
          <Button
            title="Choose Color"
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
  )
})
