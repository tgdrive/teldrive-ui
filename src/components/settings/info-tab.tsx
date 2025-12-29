import { $api } from "@/utils/api";
import { memo } from "react";
import IcRoundDesktopWindows from "~icons/ic/round-desktop-windows";
import IcRoundDns from "~icons/ic/round-dns";
import clsx from "clsx";
import { scrollbarClasses } from "@/utils/classes";

export const InfoTab = memo(() => {
  const { data: version } = $api.useQuery("get", "/version");
  const uiVersion = import.meta.env.UI_VERSION || "development";

  return (
    <div className={clsx("flex flex-col gap-6 p-4 h-full overflow-y-auto", scrollbarClasses)}>
      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-secondary-container">
            <IcRoundDesktopWindows className="size-6 text-on-secondary-container" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-1">UI Information</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0">
                <span className="text-sm font-medium text-on-surface-variant">Version</span>
                {uiVersion === "development" ? (
                  <span className="text-base font-semibold">Development</span>
                ) : (
                  <a
                    href={`https://github.com/tgdrive/teldrive-ui/commits/${uiVersion}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="text-base font-semibold text-primary hover:underline decoration-2 underline-offset-4"
                  >
                    {uiVersion.substring(0, 7)}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-secondary-container">
            <IcRoundDns className="size-6 text-on-secondary-container" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold mb-1">Server Information</h3>
            {version ? (
              <div className="mt-4 space-y-3">
                {Object.entries(version).map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-2 border-b border-outline-variant/30 last:border-0"
                  >
                    <span className="text-sm font-medium text-on-surface-variant capitalize">
                      {key}
                    </span>
                    {key === "version" && val ? (
                      <a
                        href={`https://github.com/tgdrive/teldrive/commits/${val}`}
                        rel="noopener noreferrer"
                        target="_blank"
                        className="text-base font-semibold text-primary hover:underline decoration-2 underline-offset-4"
                      >
                        {(val as string).substring(0, 7)}
                      </a>
                    ) : (
                      <span className="text-base font-semibold">
                        {(val as React.ReactNode) || "N/A"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-on-surface-variant">Could not load server version.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
