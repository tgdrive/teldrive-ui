import { memo, type MouseEvent, type SVGProps, useCallback } from "react";
import { Button } from "@tw-material/react";
import IconBasilGoogleDriveOutline from "~icons/basil/google-drive-outline";
import IconIcOutlineSdStorage from "~icons/ic/outline-sd-storage";
import IconMdiRecent from "~icons/mdi/recent";
import ShareIcon from "~icons/fluent/share-24-regular";
import clsx from "clsx";

import { ForwardLink } from "@/components/ForwardLink";
import { usePreload } from "@/utils/queryOptions";

export const categories = [
  { id: "my-drive", name: "My Drive", icon: IconBasilGoogleDriveOutline },
  { id: "recent", name: "Recent", icon: IconMdiRecent },
  { id: "shared", name: "Shared", icon: ShareIcon },
  { id: "storage", name: "Storage", icon: IconIcOutlineSdStorage },
] as const;

interface SidNavItemProps extends ReturnType<typeof usePreload> {
  id: (typeof categories)[number]["id"];
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactElement;
}

const SidNavItem = memo(({ id, icon: Icon, preloadFiles, preloadStorage }: SidNavItemProps) => {
  const handleClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (id !== "storage") {
      preloadFiles({
        type: id,
        path: "",
      });
    } else {
      preloadStorage();
    }
  }, []);

  return (
    <Button
      as={ForwardLink}
      to="/$"
      params={{ _splat: id }}
      variant="text"
      onClick={handleClick}
      isIconOnly
      className={clsx(
        "h-8 w-full max-w-14 rounded-3xl px-0 mx-auto",
        "text-on-surface-variant",
        "data-[status=active]:bg-secondary-container data-[status=active]:text-on-secondary-container",
        "[&>svg]:data-[status=active]:scale-110 [&>svg]:transition-transform",
      )}
    >
      <Icon className="size-6 text-inherit pointer-events-none" />
    </Button>
  );
});

export const SideNav = memo(() => {
  const preload = usePreload();
  return (
    <aside className="w-full md:w-20 md:pt-20 pt-0 h-12 md:h-full">
      <ul className="size-full flex-wrap flex flex-row md:flex-col items-center list-none gap-4 px-3 overflow-auto">
        {categories.map(({ id, icon: Icon }) => (
          <SidNavItem key={id} id={id} icon={Icon} {...preload} />
        ))}
      </ul>
    </aside>
  );
});
