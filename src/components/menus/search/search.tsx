import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { FilterQuery } from "@/types";
import { type NavigateOptions, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  FreeSoloPopover as Popover,
  Radio,
  RadioGroup,
} from "@tw-material/react";
import IconFaSolidFile from "~icons/fa-solid/file";
import IconFaSolidFileArchive from "~icons/fa-solid/file-archive";
import IconFaSolidFileImage from "~icons/fa-solid/file-image";
import IconFaSolidFilePdf from "~icons/fa-solid/file-pdf";
import IconFa6SolidFileVideo from "~icons/fa6-solid/file-video";
import IconIcOutlineFolderOpen from "~icons/ic/outline-folder-open";
import IconIconamoonMusic1Bold from "~icons/iconamoon/music-1-bold";
import clsx from "clsx";
import { Controller, useForm, useWatch } from "react-hook-form";

import { scrollbarClasses } from "@/utils/classes";

import { FilterChip } from "./filter-chip";

const getCurrentDateFormatted = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const categories = [
  { value: "archive", icon: IconFaSolidFileArchive },
  { value: "audio", icon: IconIconamoonMusic1Bold },
  { value: "image", icon: IconFaSolidFileImage },
  { value: "video", icon: IconFa6SolidFileVideo },
  { value: "document", icon: IconFaSolidFilePdf },
  { value: "folder", icon: IconIcOutlineFolderOpen },
  { value: "other", icon: IconFaSolidFile },
];

const locations = ["current", "custom"];

const modifiedDateValues = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "-2", label: "Custom" },
];

interface SearchMenuProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const defaultFilters = {
  category: [] as string[],
  location: "",
  modifiedDate: "",
  query: "",
  fromDate: "",
  toDate: "",
  path: "",
  deepSearch: false,
};

export const SearchMenu = memo(({ isOpen, setIsOpen, triggerRef }: SearchMenuProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: defaultFilters,
  });

  const modifiedDate = useWatch({ control, name: "modifiedDate" });

  const fromDate = useWatch({ control, name: "fromDate" });

  const location = useWatch({ control, name: "location" });

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const today = getCurrentDateFormatted();

  const router = useRouter();

  const [isSearching, setIsSearching] = useState(false);

  const onSubmit = useCallback(
    (data: typeof defaultFilters) => {
      const filterQuery = {} as FilterQuery;
      for (const key in data) {
        const value = data[key];

        if (key === "category" && value.length > 0) {
          filterQuery[key] = value.join(",");
        } else if (key === "modifiedDate") {
          if (value === "-2") {
            if (data.fromDate) {
              filterQuery.updatedAt = `gte:${data.fromDate}`;
            }
            if (data.toDate) {
              filterQuery.updatedAt = filterQuery.updatedAt
                ? `${filterQuery.updatedAt},lte:${data.toDate}`
                : `lte:${data.toDate}`;
            }
          } else if (Number(value) > 0) {
            const currentDate = new Date();
            currentDate.setUTCDate(currentDate.getUTCDate() - Number(value));
            filterQuery.updatedAt = `gte:${currentDate.toISOString().split("T")[0]}`;
          }
        } else if (key === "location" && value === "current" && pathname.includes("/my-drive")) {
          const path = pathname.split("/my-drive")[1] || "/";
          filterQuery.path = decodeURI(path);
          filterQuery.deepSearch = data.deepSearch;
        } else if (key === "location" && value === "custom" && data.path) {
          filterQuery.path = data.path;
          filterQuery.deepSearch = data.deepSearch;
        } else if (key === "query" && value) {
          filterQuery[key] = value;
        }
      }
      const nextRoute: NavigateOptions = {
        to: "/$view",
        search: filterQuery,
        params: {
          view: "search",
        },
      };

      if (Object.keys(filterQuery).length === 0) {
        return;
      }
      setIsSearching(true);
      router
        .preloadRoute(nextRoute)
        .then(() => router.navigate(nextRoute).then(() => setIsOpen(false)))
        .finally(() => setIsSearching(false));
    },
    [pathname],
  );

  useEffect(() => {
    if (modifiedDate === "-2" && formRef.current) {
      formRef.current.scrollTo({
        top: formRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [modifiedDate]);

  return (
    <Popover
      placement="bottom-end"
      isOpen={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
      triggerRef={triggerRef}
      classNames={{
        content: "max-w-96 max-h-96 justify-normal pl-4 py-2 pr-0",
      }}
    >
      <form
        ref={formRef}
        id="filter-form"
        onSubmit={handleSubmit(onSubmit)}
        className={clsx(
          "flex flex-col gap-8 py-2.5 pl-2.5 relative w-full text-on-surface overflow-y-auto",
          scrollbarClasses,
        )}
      >
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <CheckboxGroup
              classNames={{
                wrapper: "gap-2",
                label: "text-md text-inherit select-none",
              }}
              label="Category"
              orientation="horizontal"
              {...field}
            >
              {categories.map((category) => (
                <FilterChip
                  startIcon={<category.icon className="size-5" />}
                  value={category.value}
                  key={category.value}
                >
                  {category.value}
                </FilterChip>
              ))}
            </CheckboxGroup>
          )}
        />
        <Controller
          name="query"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Input
              size="md"
              labelPlacement="outside"
              label="Search Query"
              placeholder="Search..."
              autoComplete="off"
              isClearable
              onClear={() => field.onChange("")}
              className="max-w-xs"
              variant="bordered"
              isInvalid={!!error}
              errorMessage={error?.message}
              {...field}
            />
          )}
        />
        <div className="flex items-end gap-4">
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <RadioGroup
                label="Location"
                classNames={{
                  wrapper: "gap-4",
                  label: "text-md text-inherit select-none",
                }}
                orientation="horizontal"
                {...field}
              >
                {locations.map((location) => (
                  <Radio
                    value={location}
                    key={location}
                    classNames={{
                      label: "capitalize text-md",
                    }}
                  >
                    {location}
                  </Radio>
                ))}
              </RadioGroup>
            )}
          />
          <Controller
            name="deepSearch"
            control={control}
            render={({ field }) => (
              <Checkbox
                onChange={field.onChange}
                isSelected={field.value}
                name={field.name}
                onBlur={field.onBlur}
              >
                Deep Search
              </Checkbox>
            )}
          />
        </div>
        {location === "custom" && (
          <Controller
            name="path"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <Input
                size="md"
                placeholder="Custom Path"
                autoComplete="off"
                isClearable
                onClear={() => field.onChange("")}
                className="max-w-xs"
                variant="bordered"
                isInvalid={!!error}
                errorMessage={error?.message}
                {...field}
              />
            )}
          />
        )}
        <Controller
          control={control}
          name="modifiedDate"
          render={({ field }) => (
            <RadioGroup
              label="Modified Date"
              classNames={{
                wrapper: "grid gap-2 grid-cols-[repeat(auto-fit,minmax(100px,min-content))]",
                label: "text-md text-inherit select-none",
              }}
              {...field}
            >
              {modifiedDateValues.map((date) => (
                <Radio
                  classNames={{
                    base: "items-baseline",
                    label: "text-sm",
                  }}
                  value={date.value}
                  key={date.value}
                >
                  {date.label}
                </Radio>
              ))}
            </RadioGroup>
          )}
        />
        {modifiedDate === "-2" && (
          <div className="flex gap-2 pr-2">
            <Controller
              name="fromDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input
                  size="md"
                  labelPlacement="outside"
                  label="From Date"
                  autoComplete="off"
                  type="date"
                  max={today}
                  className="max-w-xs"
                  variant="bordered"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  {...field}
                />
              )}
            />
            <Controller
              name="toDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <Input
                  size="md"
                  type="date"
                  labelPlacement="outside"
                  label="To Date"
                  max={today}
                  min={fromDate}
                  autoComplete="off"
                  className="max-w-xs"
                  variant="bordered"
                  isInvalid={!!error}
                  errorMessage={error?.message}
                  {...field}
                />
              )}
            />
          </div>
        )}
      </form>
      <div className="flex gap-2 justify-end w-full pt-2.5 pb-1 px-2.5">
        <Button onPress={() => reset(defaultFilters)} size="sm" variant="text">
          Reset
        </Button>
        <Button
          form="filter-form"
          size="sm"
          type="submit"
          isLoading={isSearching}
          variant="filledTonal"
        >
          Search
        </Button>
      </div>
    </Popover>
  );
});
