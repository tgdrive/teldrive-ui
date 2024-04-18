import { memo } from "react"
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tw-material/react"
import TablerColorPicker from "~icons/tabler/color-picker"
import { HexColorPicker } from "react-colorful"

interface ColorPickerMenuProps {
  color: string
  setColor: (color: string) => void
}
export const ColorPickerMenu = memo(
  ({ color, setColor }: ColorPickerMenuProps) => {
    return (
      <Popover placement="left-start">
        <PopoverTrigger>
          <Button
            title="Choose Color"
            variant="filled"
            isIconOnly
            className="min-w-8 size-8"
          >
            <TablerColorPicker />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex flex-col gap-2 p-2.5 size-[220px] relative">
          <HexColorPicker color={color} onChange={setColor} />
        </PopoverContent>
      </Popover>
    )
  }
)
