import { useNavigate } from "@tanstack/react-router";
import { Button } from "@tw-material/react";
import type { AxiosError } from "feaxios";

export const ErrorView = ({ error }: { error: Error }) => {
  const axiosError = error as AxiosError<{ error: string }>;
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-2">
      <h4 className="text-headline-medium">{axiosError.response?.data.error || error.message}</h4>
      <Button
        variant="filledTonal"
        title="Go to main directory"
        onPress={() => {
          navigate({
            to: "/$",
            params: { _splat: "my-drive" },
            replace: true,
          });
        }}
      >
        Go to main directory
      </Button>
    </div>
  );
};
