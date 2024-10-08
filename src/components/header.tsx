import { type ChangeEvent, memo, useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Button, Input } from "@tw-material/react";
import IconBiSearch from "~icons/bi/search";
import MdiFilterOutline from "~icons/mdi/filter-outline";
import PhTelegramLogoFill from "~icons/ph/telegram-logo-fill";
import clsx from "clsx";
import debounce from "lodash.debounce";

import { usePreload } from "@/utils/query-options";

import { ProfileDropDown } from "./menus/profile";
import { SearchMenu } from "./menus/search/search";
import { ThemeToggle } from "./menus/theme-toggle";

const cleanSearchInput = (input: string) => input.trim().replace(/\s+/g, " ");

interface SearchBarProps {
  className?: string;
}

const SearchBar = memo(({ className }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  const { preloadFiles } = usePreload();

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const queryClient = useQueryClient();

  const debouncedSearch = useCallback(
    debounce(
      (newValue: string) =>
        preloadFiles(
          {
            view: "search",
            search: {
              query: newValue,
            },
          },
          false,
        ),
      1000,
    ),
    [],
  );

  const updateQuery = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    const cleanInput = cleanSearchInput(event.target.value);
    if (cleanInput) {
      queryClient.cancelQueries({
        queryKey: ["files"],
      });
      debouncedSearch(cleanInput);
    }
  }, []);

  return (
    <>
      <Input
        variant="flat"
        placeholder="Search..."
        enterKeyHint="search"
        autoComplete="off"
        aria-label="search"
        value={query}
        endContent={
          <Button
            isIconOnly
            variant="text"
            size="md"
            ref={triggerRef}
            className="size-8 min-w-8 text-current"
            onPress={() => setIsOpen((val) => !val)}
          >
            <MdiFilterOutline />
          </Button>
        }
        onChange={updateQuery}
        classNames={{
          base: clsx("min-w-[15rem] max-w-96", className),
          inputWrapper: "rounded-full group-data-[focus=true]:bg-surface",
          input: "px-2",
        }}
        startContent={<IconBiSearch className="size-6" />}
      />
      {isOpen && <SearchMenu isOpen={isOpen} setIsOpen={setIsOpen} triggerRef={triggerRef} />}
    </>
  );
});

export default memo(function Header({ auth }: { auth?: boolean }) {
  return (
    <header className="sticky top-0 z-50 flex items-center min-h-12 xs:min-h-16 px-4">
      <div className="flex-1 flex gap-2 items-center">
        <Link
          to="/$view"
          params={{ view: "my-drive" }}
          search={{ path: "/" }}
          className="flex gap-2 items-center cursor-pointer"
        >
          <PhTelegramLogoFill className="size-6 text-inherit" />
          <p className="text-headline-small hidden sm:block">Teldrive</p>
        </Link>
      </div>
      <div className="flex-1 flex justify-end items-center gap-4">
        {auth && <SearchBar className="hidden xs:block" />}
        <ThemeToggle />
        {auth && <ProfileDropDown />}
      </div>
    </header>
  );
});
