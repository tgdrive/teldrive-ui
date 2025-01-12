import { memo, useEffect, useState } from "react";
import type { CategoryStorage } from "@/types";
import { queryOptions, useSuspenseQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { filesize } from "filesize";

import { grow } from "@/utils/classes";

import { UploadStatsChart } from "./charts/upload-stats";
import { $api } from "@/utils/api";
import { bytesToGB } from "@/utils/common";

function getTotalStats(data: CategoryStorage[]) {
  return data.reduce(
    (acc, item) => {
      acc.totalSize += item.totalSize;
      acc.totalFiles += item.totalFiles;
      return acc;
    },
    { totalSize: 0, totalFiles: 0 },
  );
}

const CategoryStorageCard = memo(({ category, totalSize, totalFiles }: CategoryStorage) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  return (
    <Link
      to="/$view"
      params={{ view: "browse" }}
      search={{ category: category as any }}
      className="min-h-40 bg-surface rounded-xl"
    >
      <div
        data-mounted={isMounted}
        className={clsx("flex flex-col justify-center items-center h-full duration-300", grow)}
      >
        <h2 className="text-2xl font-medium capitalize">{`${category}s`}</h2>
        <p className="text-3xl font-semibold">{filesize(totalSize, { standard: "jedec" })}</p>
        <p className="text-sm font-semibold">{totalFiles} files</p>
      </div>
    </Link>
  );
});

export const StorageView = memo(() => {
  const [days, setDays] = useState(7);
  const [{ data: uploadStats }, { data: categories }] = useSuspenseQueries({
    queries: [
      queryOptions({
        ...$api.queryOptions("get", "/uploads/stats", {
          params: {
            query: {
              days: 60,
            },
          },
        }),
        select: (data) =>
          data.slice(data.length - days, data.length).map((stat) => {
            const options = { day: "numeric", month: "short" } as const;
            const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
              new Date(stat.uploadDate),
            );
            return {
              totalUploaded: bytesToGB(stat.totalUploaded),
              uploadDate: formattedDate,
            };
          }),
      }),
      queryOptions({
        ...$api.queryOptions("get", "/files/categories"),
        select: (data) => ({ data, totalStats: getTotalStats(data) }),
      }),
    ],
  });

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] pb-4 gap-2">
        {categories.data.map((category) => (
          <CategoryStorageCard key={category.category} {...category} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <UploadStatsChart days={days} setDays={setDays} stats={uploadStats} />
        <div className="col-span-12 rounded-lg bg-surface text-on-surface p-4 lg:col-span-4 max-h-56">
          <h2 className="text-2xl font-medium">Storage</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h3 className="text-lg font-semibold">Total Size</h3>
              <p className="text-3xl font-semibold">
                {filesize(categories.totalStats.totalSize, { standard: "jedec" })}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Total Files</h3>
              <p className="text-3xl font-semibold">{categories.totalStats.totalFiles}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
