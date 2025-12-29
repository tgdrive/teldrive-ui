import { memo, type SVGProps } from "react";
import { Button } from "@tw-material/react";
import IconBasilGoogleDriveOutline from "~icons/basil/google-drive-outline";
import IconIcOutlineSdStorage from "~icons/ic/outline-sd-storage";
import IconMdiRecent from "~icons/mdi/recent";
import ShareIcon from "~icons/fluent/share-24-regular";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "@tanstack/react-router";

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
  const params = useParams({ strict: false }) as { view?: string };
  const location = useLocation();

  const isActive =
    id === "storage" ? location.pathname === "/storage" : params.view === id;

  return (
    <li className="flex flex-col gap-1 w-16 items-center">
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
          isActive && "text-on-secondary-container ",
        )}
      >
        <AnimatePresence>
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute inset-0 bg-secondary-container rounded-3xl -z-10"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            />
          )}
        </AnimatePresence>
        <motion.div
          animate={{
            scale: isActive ? 1.1 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 17,
          }}
          className="flex items-center justify-center relative z-10"
        >
          <Icon className="size-6" />
        </motion.div>
      </Button>
      <p
        className={clsx(
          "text-label-small transition-colors duration-200",
          isActive ? "text-on-surface font-medium" : "text-on-surface-variant",
        )}
      >
        {name}
      </p>
    </li>
  );
});

export const SideNav = memo(() => {
  return (
    <aside
      className={clsx(
        "w-full md:w-20 md:pt-20 pt-0 h-16 md:h-full transition-colors duration-300",
      )}
    >
      <ul
        className="size-full flex flex-row justify-evenly md:justify-normal md:flex-col
        items-center list-none gap-4 overflow-hidden py-2 md:py-0"
      >
        {categories.map((item) => (
          <SidNavItem key={item.id} {...item} />
        ))}
      </ul>
    </aside>
  );
});
