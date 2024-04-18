import { memo, useCallback } from "react"
import { Button, Input, Select, SelectItem } from "@tw-material/react"
import clsx from "clsx"
import { Controller, useForm } from "react-hook-form"

import useSettings from "@/hooks/useSettings"
import { scrollbarClasses } from "@/utils/classes"
import { splitFileSizes } from "@/utils/common"

export const GeneralTab = memo(() => {
  const { settings, setSettings } = useSettings()

  const { control, handleSubmit } = useForm({
    defaultValues: settings,
  })

  const onSubmit = useCallback((data: typeof settings) => setSettings(data), [])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx(
        "grid grid-cols-6 gap-8 p-2 w-full overflow-y-auto",
        scrollbarClasses
      )}
    >
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Upload Concurrency</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Concurrent Part Uploads
        </p>
      </div>
      <Controller
        name="uploadConcurrency"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            size="lg"
            className="col-span-6 xs:col-span-3"
            variant="bordered"
            isInvalid={!!error}
            errorMessage={error?.message}
            type="number"
            {...field}
          ></Input>
        )}
      />
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Resizer Host</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Image Resize Url to resize images
        </p>
      </div>
      <Controller
        name="resizerHost"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            size="lg"
            className="col-span-6 xs:col-span-3"
            variant="bordered"
            isInvalid={!!error}
            errorMessage={error?.message}
            {...field}
          ></Input>
        )}
      />
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Page Size</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Number of items per page
        </p>
      </div>
      <Controller
        name="pageSize"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Input
            size="lg"
            className="col-span-6 xs:col-span-3"
            variant="bordered"
            isInvalid={!!error}
            errorMessage={error?.message}
            {...field}
            type="number"
          ></Input>
        )}
      />
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Split File Size</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Split File Size for multipart uploads
        </p>
      </div>
      <Controller
        name="splitFileSize"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Select
            aria-label="Split File Size"
            size="lg"
            className="col-span-6 xs:col-span-3"
            variant="bordered"
            isInvalid={!!error}
            defaultSelectedKeys={[field.value]}
            items={splitFileSizes}
            errorMessage={error?.message}
            {...field}
          >
            {(size) => (
              <SelectItem key={size.value} value={size.value}>
                {size.label}
              </SelectItem>
            )}
          </Select>
        )}
      />
      <div className="col-span-6 xs:col-span-3">
        <p className="text-lg font-medium">Encrypt Files</p>
        <p className="text-sm font-normal text-on-surface-variant">
          Encrypt Files before uploading
        </p>
      </div>
      <div className="col-span-6 xs:col-span-3">
        <Controller
          name="encryptFiles"
          control={control}
          render={({ field }) => (
            <>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  onChange={(e) => {
                    field.onChange({ target: { value: e.target.checked } })
                  }}
                  checked={field.value}
                  name={field.name}
                  onBlur={field.onBlur}
                />
                <span
                  className={clsx(
                    "w-14 h-8 peer bg-gray-400 peer-focus:outline-none rounded-full",
                    "peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px]",
                    "after:bg-white after:rounded-full after:h-6",
                    "after:w-6 after:transition-all peer-checked:bg-primary"
                  )}
                />
              </label>
            </>
          )}
        />
      </div>
      <div className="col-span-6 flex justify-end">
        <Button type="submit" variant="filledTonal">
          Save
        </Button>
      </div>
    </form>
  )
})
