import { memo, useCallback } from "react";
import { useSearch } from "@tanstack/react-router";
import { Button } from "@tw-material/react";
import IconGithub from "~icons/mdi/github";

export const Login = memo(() => {
  const params = useSearch({ from: "/_auth/login" });

  const handleLogin = useCallback(() => {
    window.location.replace(
      new URL(
        `/api/auth/login${params.redirect ? `?redirect=${params.redirect}` : ""}`,
        window.location.origin,
      ),
    );
  }, [params.redirect]);

  return (
    <div className="m-auto flex rounded-large h-48 max-w-sm flex-row justify-center items-center bg-surface mt-12">
      <Button
        onPress={handleLogin}
        variant="filledTonal"
        className="w-[80%] text-inherit"
        startContent={<IconGithub />}
      >
        Sign In
      </Button>
    </div>
  );
});
