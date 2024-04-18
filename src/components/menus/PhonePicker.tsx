import { memo, useMemo, useState } from "react"
import { useFilter } from "@react-aria/i18n"
import {
  Divider,
  Input,
  Listbox,
  ListboxItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@tw-material/react"
import clsx from "clsx"
import type { ControllerRenderProps } from "react-hook-form"

import { isoCodeMap, isoCodes, type FormState } from "@/components/Login"
import { scrollbarClasses } from "@/utils/classes"
import { flags } from "@/utils/country-flags"

interface PhoneNoPickerProps {
  field: ControllerRenderProps<FormState, "phoneCode">
}

export const PhoneNoPicker = memo(({ field }: PhoneNoPickerProps) => {
  const { contains } = useFilter({
    sensitivity: "base",
  })

  const [isOpen, setIsOpen] = useState(false)

  const [value, setValue] = useState("")

  const codes = useMemo(
    () => isoCodes.filter((composer) => contains(composer.country, value)),
    [value]
  )
  const TriggerIcon = flags[field.value as keyof typeof flags]

  return (
    <Popover
      classNames={{
        base: "max-w-xs rounded-lg shadow-sm",
        content: "rounded-lg shadow-1 min-w-72 p-0",
      }}
      placement="bottom-start"
      offset={10}
      triggerScaleOnOpen={false}
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <PopoverTrigger>
        <button className="outline-none flex gap-3 items-center shrink-0">
          <TriggerIcon width={30} height={20} />
          <span className="text-on-surface-variant min-w-10">
            {isoCodeMap[field.value].value}
          </span>
          <Divider className="h-8" orientation="vertical" />
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <Input
          value={value}
          placeholder="country"
          className="w-full p-4"
          onValueChange={setValue}
          isClearable
        />
        <Listbox
          items={codes}
          className={clsx(
            "max-h-64 overflow-y-auto rounded-lg bg-inherit",
            scrollbarClasses
          )}
          onAction={(key) => {
            field.onChange({ target: { value: key } })
            setIsOpen(false)
          }}
          isVirtualized
        >
          {(item) => {
            const Flag = flags[item.code as keyof typeof flags]
            return (
              <ListboxItem
                key={item.code}
                textValue={item.country}
                value={item.code}
                hideSelectedIcon
              >
                <div className="flex w-full items-center gap-3">
                  <Flag className="shrink-0" width={30} height={20} />
                  <span>{item.country}</span>
                  <span className="ml-auto">{item.value}</span>
                </div>
              </ListboxItem>
            )
          }}
        </Listbox>
      </PopoverContent>
    </Popover>
  )
})
