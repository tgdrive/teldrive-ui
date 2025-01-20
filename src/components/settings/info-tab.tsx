import { $api } from "@/utils/api";
import { memo } from "react";

export const InfoTab = memo(() => {
  const { data: version } = $api.useQuery("get", "/version");
  return (
    <div className="flex flex-col gap-3">
      <span className="flex flex-col gap-2">
        <p className="text-lg font-medium">UI</p>
        <p className="text-md font-normal">
          <span>Version: </span>
          <span className="font-semibold"> {import.meta.env.UI_VERSION} </span>
        </p>
      </span>
      <span className="flex gap-2 flex-col">
        <p className="text-lg font-medium">Server</p>
        {version &&
          Object.entries(version).map(([key, val]) => (
            <p key={key}>
              <span className="capitalize">{key}: </span>
              <span className="font-semibold">{val}</span>
            </p>
          ))}
      </span>
    </div>
  );
});
