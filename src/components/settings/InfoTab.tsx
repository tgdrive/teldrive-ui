import { Link } from "@tanstack/react-router";
import { memo } from "react";

export const InfoTab = memo(() => {
  return (
    <div className="flex flex-col gap-3">
      <span className="inline-flex items-center gap-2">
        <p className="text-lg font-medium">UI Version:</p>
        <a
          href={`https://github.com/divyam234/teldrive-ui/commits/${import.meta.env.UI_VERSION}`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-md font-normal"
        >
          {import.meta.env.UI_VERSION}
        </a>
      </span>
      <span className="inline-flex items-center gap-2">
        <p className="text-lg font-medium">Server Version:</p>
        <a
          href={`https://github.com/divyam234/teldrive/commits/${import.meta.env.VITE_SERVER_VERSION}`}
          rel="noopener noreferrer"
          target="_blank"
          className="text-md font-normal"
        >
          {import.meta.env.VITE_SERVER_VERSION}
        </a>
      </span>
    </div>
  );
});
