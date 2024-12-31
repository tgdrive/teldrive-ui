import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@tw-material/react";
import IconBaselineLogout from "~icons/ic/baseline-logout";
import IconOutlineSettings from "~icons/ic/outline-settings";

import { profileName, profileUrl } from "@/utils/common";

import { useSession } from "@/utils/query-options";
import { $api } from "@/utils/api";

export function ProfileDropDown() {
  const [session, _, refetch] = useSession();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const signOut = $api.useMutation("post", "/auth/logout", {
    onSuccess: () => {
      refetch().then(() => {
        queryClient.removeQueries();
        navigate({ to: "/login", replace: true });
      });
    },
  });

  return (
    <Dropdown
      classNames={{
        content: "min-w-36",
      }}
    >
      <DropdownTrigger>
        <Avatar
          as="button"
          size="sm"
          showFallback
          className="outline-none shrink-0"
          src={"/api/users/profile/profile.jpeg"}
        />
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Profile Menu"
        className="rounded-lg shadow-1"
        itemClasses={{
          title: "text-medium",
          startContent: "text-on-surface",
          endContent: "text-on-surface",
        }}
      >
        <DropdownItem key="profile" className="pointer-events-none">
          <p className="font-semibold">{session?.name}</p>
        </DropdownItem>

        <DropdownItem
          key="settings"
          as={Link}
          //@ts-ignore
          to="/settings/$tabId"
          params={{ tabId: "general" }}
          endContent={<IconOutlineSettings className="size-6" />}
        >
          Settings
        </DropdownItem>
        <DropdownItem
          key="logout"
          endContent={<IconBaselineLogout className="size-6" />}
          onPress={() => signOut.mutateAsync({})}
        >
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
