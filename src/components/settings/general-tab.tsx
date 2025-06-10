import { memo, useCallback } from "react";
import { Button, Input, scrollbarClasses, Select, SelectItem, Switch } from "@tw-material/react";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";

import useSettings from "@/hooks/use-settings";
import { splitFileSizes } from "@/utils/common";

function validateUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
export const GeneralTab = memo(() => {
  const { settings, setSettings } = useSettings();

  const { control, handleSubmit } = useForm({
    defaultValues: settings,
  });

  const onSubmit = useCallback((data: typeof settings) => setSettings(data), []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={clsx("flex flex-col gap-6 p-4 h-full overflow-y-auto", scrollbarClasses)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">Upload Concurrency</p>
          <p className="text-sm font-normal text-on-surface-variant">Concurrent Part Uploads</p>
        </div>
        <Controller
          name="uploadConcurrency"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              size="lg"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error?.message}
              type="number"
              {...field}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">Resizer Host</p>
          <p className="text-sm font-normal text-on-surface-variant">
            Image Resize Host to resize images
          </p>
        </div>
        <Controller
          name="resizerHost"
          control={control}
          rules={{
            validate: (value) => (value ? validateUrl(value) || "Must be a valid Host" : true),
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              size="lg"
              variant="bordered"
              placeholder="https://resizer.example.com"
              isInvalid={!!error}
              errorMessage={error?.message}
              {...field}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">Page Size</p>
          <p className="text-sm font-normal text-on-surface-variant">Number of items per page</p>
        </div>
        <Controller
          name="pageSize"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              size="lg"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error?.message}
              {...field}
              type="number"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
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
              variant="bordered"
              isInvalid={!!error}
              defaultSelectedKeys={[field.value]}
              scrollShadowProps={{
                isEnabled: false,
              }}
              classNames={{
                popoverContent: "rounded-lg shadow-1",
              }}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">Encrypt Files</p>
          <p className="text-sm font-normal text-on-surface-variant">
            Encrypt Files before uploading
          </p>
        </div>
        <div className="flex justify-start">
          <Controller
            name="encryptFiles"
            control={control}
            render={({ field }) => (
              <Switch
                size="lg"
                onChange={field.onChange}
                isSelected={field.value}
                name={field.name}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <p className="text-lg font-medium">Rclone Media Proxy</p>
          <p className="text-sm font-normal text-on-surface-variant">
            Play Files directly from Rclone Webdav
          </p>
        </div>
        <Controller
          name="rcloneProxy"
          control={control}
          rules={{
            validate: (value) => (value ? validateUrl(value) || "Must be a valid Host" : true),
          }}
          render={({ field, fieldState: { error } }) => (
            <Input
              size="lg"
              variant="bordered"
              placeholder="http://localhost:8080"
              isInvalid={!!error}
              errorMessage={error?.message}
              {...field}
            />
          )}
        />
      </div>

      <div className="flex justify-end mt-4">
        <Button type="submit" variant="filledTonal">
          Save
        </Button>
      </div>
    </form>
  );
});
