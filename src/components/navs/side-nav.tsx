import { memo, type SVGProps } from "react";
import { Button } from "@tw-material/react";
import IconBasilGoogleDriveOutline from "~icons/basil/google-drive-outline";
import IconIcOutlineSdStorage from "~icons/ic/outline-sd-storage";
import IconMdiRecent from "~icons/mdi/recent";
import ShareIcon from "~icons/fluent/share-24-regular";
import clsx from "clsx";

import { ForwardLink } from "@/components/forward-link";

export const categories = [
  { id: "my-drive", name: "My Drive", icon: IconBasilGoogleDriveOutline },
  { id: "recent", name: "Recent", icon: IconMdiRecent },
  { id: "shared", name: "Shared", icon: ShareIcon },
  { id: "storage", name: "Storage", icon: IconIcOutlineSdStorage },
] as const;

interface SidNavItemProps {
  id: (typeof categories)[number]["id"];
  icon: (props: SVGProps<SVGSVGElement>) => React.ReactNode;
  name: string;
}

const SidNavItem = memo(({ id, icon: Icon, name }: SidNavItemProps) => {
  return (
    <div className="flex flex-col gap-1 w-16 items-center">
      <Button
        as={ForwardLink}
        disableRipple
        to={id === "storage" ? "/storage" : "/$view"}
        params={{ view: id }}
        search={id === "my-drive" ? { path: "/" } : {}}
        variant="text"
        isIconOnly
        preload="intent"
        className={clsx(
          "h-8 w-full max-w-16 rounded-3xl px-0 mx-auto",
          "text-on-surface-variant",
          "data-[status=active]:bg-secondary-container data-[status=active]:text-on-secondary-container",
          "[&>svg]:data-[status=active]:scale-110 [&>svg]:transition-transform",
        )}
      >
        <Icon className="size-6" />
      </Button>
      <p className="text-label-small text-on-surface">{name}</p>
    </div>
  );
});

export const SideNav = memo(() => {
  return (
    <aside className="w-full md:w-20 md:pt-20 pt-0 h-16 md:h-full">
      <ul
        className="size-full flex flex-row justify-evenly md:justify-normal md:flex-col 
        items-center list-none gap-4 overflow-hidden"
      >
        {categories.map((item) => (
          <SidNavItem key={item.id} {...item} />
        ))}
      </ul>
    </aside>
  );
});
