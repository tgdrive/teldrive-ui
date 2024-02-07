import { SortState } from "@/types"
import { SortOrder } from "@bhunter179/chonky"
import { useLocalStorage } from "usehooks-ts"

export const defaultSortState: SortState = {
  "my-drive": { sort: "name", order: SortOrder.ASC },
  search: { sort: "name", order: SortOrder.ASC },
  starred: { sort: "updatedAt", order: SortOrder.DESC },
  recent: { sort: "updatedAt", order: SortOrder.DESC },
}

export function useSortFilter() {
  const [sortFilter, setSortFilter] = useLocalStorage<SortState>(
    "sortFilter",
    defaultSortState
  )
  return { sortFilter, setSortFilter }
}
