import { Fragment, memo } from "react";
import { Button, Input } from "@tw-material/react";
import clsx from "clsx";
import { Controller, useForm } from "react-hook-form";
import { scrollbarClasses } from "@/utils/classes";
import { useSettings, type Settings } from "@/utils/stores/settings";

type InputConfig<T extends keyof Settings = keyof Settings> = {
  key: T;
  title: string;
  description: string;
  placeholder?: string;
  type?: "text" | "number" | "url";
  validation?: (value: Settings[T]) => true | string;
  formatValue?: (value: Settings[T]) => string;
};

const validateUrl = (value: string): true | string => {
  try {
    new URL(value);
    return true;
  } catch {
    return "Must be a valid URL";
  }
};

const inputConfigs: InputConfig[] = [
  {
    key: "resizerHost",
    title: "Resizer Host",
    description: "Image Resize Host to resize images",
    placeholder: "https://resizer.example.com",
    type: "url",
    validation: (value) => !value || validateUrl(value as string),
  },
  {
    key: "pageSize",
    title: "Page Size",
    description: "Number of items per page",
    type: "number",
    formatValue: (value) => String(value),
  },
  {
    key: "rcloneProxy",
    title: "Rclone Media Proxy",
    description: "Play Files directly from Rclone Webdav",
    placeholder: "http://localhost:8080",
    type: "url",
    validation: (value) => !value || validateUrl(value as string),
  },
] as const;

type CheckKeys = keyof Settings extends (typeof inputConfigs)[number]["key"] ? true : false;

type _Check = CheckKeys extends true ? true : never;

export const GeneralTab = memo(() => {
  const { reset, setSettings, ...settings } = useSettings();

  const { control, handleSubmit } = useForm<Settings>({
    defaultValues: settings,
  });

  return (
    <form
      onSubmit={handleSubmit(setSettings)}
      className={clsx("grid grid-cols-6 gap-8 p-2 pr-4 w-full overflow-y-auto", scrollbarClasses)}
    >
      {inputConfigs.map((config) => (
        <Fragment key={config.key}>
          <div className="col-span-6 xs:col-span-3">
            <p className="text-lg font-medium">{config.title}</p>
            <p className="text-sm font-normal text-on-surface-variant">{config.description}</p>
          </div>
          <Controller<Settings>
            name={config.key}
            control={control}
            rules={{
              validate: config.validation,
            }}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="lg"
                className="col-span-6 xs:col-span-3"
                variant="bordered"
                placeholder={config.placeholder}
                type={config.type}
                autoComplete="off"
                isInvalid={!!error}
                errorMessage={error?.message}
                {...field}
                value={
                  config.formatValue ? config.formatValue(field.value) : (field.value as string)
                }
              />
            )}
          />
        </Fragment>
      ))}

      <div className="col-span-6 flex justify-end">
        <Button type="submit" variant="filledTonal">
          Save
        </Button>
      </div>
    </form>
  );
});
