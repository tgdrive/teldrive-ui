import { $api } from "@/utils/api";
import { memo } from "react";

export const InfoTab = memo(() => {
  const { data: version } = $api.useQuery("get", "/version");
  const uiVersion = import.meta.env.UI_VERSION || "development";

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <div className="shadow-none border border-outline-variant rounded-lg">
        <div className="p-4">
          <p className="text-lg font-medium">UI Information</p>
        </div>
        <hr className="border-outline-variant mx-4" />
        <div className="p-4 gap-2 flex flex-col">
          <div className="flex justify-between items-center">
            <span className="text-sm">Version:</span>
            {uiVersion === "development" ? (
              <span className="font-semibold text-sm">Development</span>
            ) : (
              <a
                href={`https://github.com/tgdrive/teldrive-ui/commits/${uiVersion}`}
                rel="noopener noreferrer"
                target="_blank"
                className="text-sm font-semibold text-primary"
              >
                {uiVersion.substring(0, 7)}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="shadow-none border border-outline-variant rounded-lg">
        <div className="p-4">
          <p className="text-lg font-medium">Server Information</p>
        </div>
        <hr className="border-outline-variant mx-4" />
        <div className="p-4 gap-2 flex flex-col">
          {version ? (
            Object.entries(version).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="capitalize text-sm">{key}:</span>
                {key === "version" && val ? (
                  <a
                    href={`https://github.com/tgdrive/teldrive/commits/${val}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="font-semibold text-sm text-primary"
                  >
                    {val.substring(0, 7)}
                  </a>
                ) : (
                  <span className="font-semibold text-sm">{val || "N/A"}</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-on-surface-variant">Could not load server version.</p>
          )}
        </div>
      </div>
    </div>
  );
});
