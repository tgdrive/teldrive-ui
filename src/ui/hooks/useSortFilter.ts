import { SortState } from "@/ui/types"
import { SortOrder } from "@bhunter179/chonky"
import { useLocalStorage } from "usehooks-ts"

const defaultState: SortState = {
  "my-drive": { sort: "name", order: SortOrder.ASC },
  search: { sort: "name", order: SortOrder.ASC },
  starred: { sort: "updatedAt", order: SortOrder.DESC },
  recent: { sort: "updatedAt", order: SortOrder.DESC },
}

export function useSortFilter() {
  const [sortFilter, setSortFilter] = useLocalStorage<SortState>(
    "sortFilter",
    defaultState
  )
  return { sortFilter, setSortFilter }
}
