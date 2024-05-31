import { memo, MouseEvent, useCallback, useEffect, useState } from "react"
import { CategoryStorage } from "@/types"
import { useSuspenseQueries } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import clsx from "clsx"
import { filesize } from "filesize"

import { grow } from "@/utils/classes"
import {
  categoryStorageQueryOptions,
  uploadStatsQueryOptions,
  usePreload,
} from "@/utils/queryOptions"

import { UploadStatsChart } from "./charts/UploadStats"

function getTotalStats(data: CategoryStorage[]) {
  return data.reduce(
    (acc, item) => {
      acc.totalSize += item.totalSize
      acc.totalFiles += item.totalFiles
      return acc
    },
    { totalSize: 0, totalFiles: 0 }
  )
}

const CategoryStorageCard = memo(
  ({ category, totalSize, totalFiles }: CategoryStorage) => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => setIsMounted(true), [])

    const { preloadFiles } = usePreload()

    const handleClick = useCallback((e: MouseEvent<"a">) => {
      e.preventDefault()
      preloadFiles({
        type: "category",
        path: `/${category}`,
      })
    }, [])

    return (
      <Link
        to="/$"
        params={{ _splat: `category/${category}s` }}
        className="min-h-40 bg-surface rounded-xl"
        preload={false}
        onClick={handleClick}
      >
        <div
          data-mounted={isMounted}
          className={clsx(
            "flex flex-col justify-center items-center h-full duration-300",
            grow
          )}
        >
          <h2 className="text-2xl font-medium capitalize">{category + "s"}</h2>
          <p className="text-3xl font-semibold">
            {filesize(totalSize, { standard: "jedec" })}
          </p>
          <p className="text-sm font-semibold">{totalFiles} files</p>
        </div>
      </Link>
    )
  }
)

export const StorageView = memo(() => {
  const [days, setDays] = useState(7)

  const [uploadStats, categoryStorageData] = useSuspenseQueries({
    queries: [uploadStatsQueryOptions(days), categoryStorageQueryOptions],
  })

  const totalStats = getTotalStats(categoryStorageData.data)

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] pb-4 gap-2">
        {categoryStorageData.data.map((category) => (
          <CategoryStorageCard key={category.category} {...category} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <UploadStatsChart
          days={days}
          setDays={setDays}
          stats={uploadStats.data}
        />
        <div className="col-span-12 rounded-lg bg-surface text-on-surface p-4 lg:col-span-4 max-h-56">
          <h2 className="text-2xl font-medium">Storage</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold">Total Size</h3>
              <p className="text-3xl font-semibold">
                {filesize(totalStats.totalSize, { standard: "jedec" })}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Files</h3>
              <p className="text-3xl font-semibold">{totalStats.totalFiles}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})
