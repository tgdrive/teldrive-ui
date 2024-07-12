import type { Settings } from "@/types";

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export const sortViewMap = {
  "my-drive": {
    sortId: "sort_files_by_name",
    order: SortOrder.ASC,
  },
  browse: {
    sortId: "sort_files_by_name",
    order: SortOrder.ASC,
  },
  search: { sortId: "sort_files_by_name", order: SortOrder.ASC },
  starred: { sortId: "sort_files_by_date", order: SortOrder.DESC },
  recent: { sortId: "sort_files_by_date", order: SortOrder.DESC },
  category: { sortId: "sort_files_by_name", order: SortOrder.ASC },
};

export type SortState = typeof sortViewMap;

export const getSortState = () =>
  (JSON.parse(localStorage.getItem("sort")!) as null | SortState["my-drive"]) ||
  sortViewMap["my-drive"];

export const defaultSortState = getSortState();

export const defaultViewId = localStorage.getItem("viewId") || "enable_list_view";

export const sortIdsMap = {
  sort_files_by_name: "name",
  sort_files_by_date: "updatedAt",
  sort_files_by_size: "size",
} as const;

export const settings = JSON.parse(localStorage.getItem("settings") || "{}") as Settings;

export const BREAKPOINTS = { xs: 0, sm: 476, md: 576, lg: 992 };
