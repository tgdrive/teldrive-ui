import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from "@tw-material/react";
import IconBaselineLogout from "~icons/ic/baseline-logout";
import IconOutlineSettings from "~icons/ic/outline-settings";

import { profileName, profileUrl } from "@/utils/common";
import http from "@/utils/http";
import { userQueries } from "@/utils/query-options";

export function ProfileDropDown() {
  const { data: session, refetch } = useQuery(userQueries.session());
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const signOut = useCallback(async () => {
    const res = await http.post("/api/auth/logout");
    refetch();
    if (res.status === 200) {
      queryClient.removeQueries();
      navigate({ to: "/login", replace: true });
    }
  }, []);

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
          src={profileUrl(session!)}
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
          <p className="font-semibold">{profileName(session!)}</p>
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
          onPress={signOut}
        >
          Logout
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
