import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { AuthMessage } from "@/types";
import { useSearch } from "@tanstack/react-router";
import { Button, Input, Spinner } from "@tw-material/react";
import { AsYouType, getPhoneCode, type CountryCode } from "libphonenumber-js";
import meta from "libphonenumber-js/metadata.min.json";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useWebSocket from "react-use-websocket";

import QrCode from "@/components/QrCode";
import { TelegramIcon } from "@/components/TelegramIcon";
import { useProgress } from "@/components/TopProgress";
import http from "@/utils/http";

import { PhoneNoPicker } from "./menus/PhonePicker";

const getKeys = Object.keys as <T>(object: T) => (keyof T)[];

export const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

function sortISOCodes(countryCodes: CountryCode[]) {
  return [...countryCodes].sort((countryCodeA, countryCodeB) => {
    const countryA = displayNames.of(countryCodeA) as string;
    const countryB = displayNames.of(countryCodeB) as string;

    return countryA.localeCompare(countryB);
  });
}

export const isoCodes = sortISOCodes(getKeys(meta.countries))
  .filter((x) => x !== "TA" && x !== "AC")
  .map((code) => ({
    code,
    country: displayNames.of(code) as string,
    value: `+${getPhoneCode(code)}`,
  }));

export const isoCodeMap = isoCodes.reduce(
  (acc, value) => {
    acc[value.code] = value;
    return acc;
  },
  {} as Record<CountryCode, (typeof isoCodes)[0]>,
);

function getTypedNumber(value: string, defaultCountryCode = "IN") {
  if (value) {
    const phone = new AsYouType(defaultCountryCode as CountryCode);
    phone.input(value);
    return phone
      .getNumber()
      ?.formatInternational()
      .replace(isoCodeMap[defaultCountryCode].value, "");
  }
  return value;
}

export type FormState = {
  otpCodeHash?: string;
  otpCode: string;
  phoneNumber: string;
  phoneCode: CountryCode;
  password?: string;
};

type LoginType = "qr" | "phone";

const getWebSocketUrl = () => {
  const host = window.location.origin;
  const url = new URL(host);
  return `${url.protocol === "http:" ? "ws" : "wss"}://${url.host}/api/auth/ws`;
};

const initailState = {
  loginType: "phone" as LoginType,
  qrCode: "",
  step: 1,
  isLoading: false,
  form: {
    phoneCode: "IN",
    phoneNumber: "",
  } as FormState,
};

export const Login = memo(() => {
  const { redirect } = useSearch({ from: "/_auth/login" });

  const [state, setState] = useState(initailState);

  const { control, handleSubmit, getValues } = useForm({
    defaultValues: initailState.form,
  });

  const { sendJsonMessage, lastJsonMessage } = useWebSocket<AuthMessage>(
    `${getWebSocketUrl()}`,
    {},
  );

  const { startProgress, stopProgress } = useProgress();

  const postLogin = useCallback(
    async function postLogin(payload: Record<string, any>) {
      startProgress();
      const res = await http.post("/api/auth/login", payload);
      if (res.status === 200) {
        window.location.pathname = redirect || "/";
      }
      stopProgress();
    },
    [redirect],
  );

  const onSubmit = useCallback(
    ({ phoneNumber, otpCode, password, phoneCode }: FormState) => {
      if (state.step === 1 && state.loginType === "phone") {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          form: { ...prev.form, phoneNumber, phoneCode },
        }));
        sendJsonMessage({
          authType: state.loginType,
          message: "sendcode",
          phoneNo: `+${getPhoneCode(phoneCode)}${phoneNumber}`,
        });
      } else if (state.step === 2 && state.loginType === "phone") {
        setState((prev) => ({
          ...prev,
          isLoading: true,
        }));
        sendJsonMessage({
          authType: state.loginType,
          message: "signin",
          phoneNo: `+${getPhoneCode(phoneCode)}${phoneNumber}`,
          phoneCode: otpCode,
          phoneCodeHash: state.form.otpCodeHash,
        });
      } else if (state.step === 3) {
        setState((prev) => ({
          ...prev,
          isLoading: true,
        }));
        sendJsonMessage({
          authType: "2fa",
          password,
        });
      }
    },
    [state.form.otpCodeHash, state.loginType, state.step],
  );

  const firstCall = useRef(false);

  useEffect(() => {
    if (state.loginType === "qr" && !firstCall.current) {
      sendJsonMessage({ authType: state.loginType });
      firstCall.current = true;
    }
  }, [state.loginType]);

  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage?.message === "success") {
        postLogin(lastJsonMessage.payload);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      } else if (lastJsonMessage?.payload?.phoneCodeHash) {
        const otpCodeHash = lastJsonMessage.payload.phoneCodeHash as string;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          step: 2,
          form: { ...prev.form, otpCodeHash },
        }));
      } else if (lastJsonMessage?.payload?.token) {
        setState((prev) => ({
          ...prev,
          qrCode: lastJsonMessage.payload.token as string,
        }));
      } else if (lastJsonMessage?.message === "2FA required") {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          step: 3,
        }));
      } else if (lastJsonMessage.type === "error") {
        toast.error(lastJsonMessage.message);
      }
    }
  }, [lastJsonMessage]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = getTypedNumber(e.target.value, getValues("phoneCode"));
    e.target.value = value || "";
  }, []);

  return (
    <div className="m-auto flex rounded-large max-w-md flex-col justify-center items-center bg-surface mt-6 gap-4 px-4 pt-6 pb-20">
      <form
        autoComplete="off"
        className="w-full flex flex-col items-center gap-8"
        onSubmit={handleSubmit(onSubmit)}
      >
        {state.loginType === "phone" ? (
          <>
            <TelegramIcon className="size-40" />
            {state.step === 1 && (
              <Controller
                name="phoneNumber"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <Input
                    isRequired
                    size="lg"
                    label="Phone Number"
                    labelPlacement="outside"
                    variant="bordered"
                    className="max-w-xs"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    startContent={
                      <Controller
                        name="phoneCode"
                        control={control}
                        render={({ field: innerField }) => <PhoneNoPicker field={innerField} />}
                      />
                    }
                    {...field}
                    onChange={(e) => {
                      onInputChange(e);
                      field.onChange(e);
                    }}
                  />
                )}
              />
            )}
            {state.step === 2 && (
              <Controller
                name="otpCode"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <Input
                    isRequired
                    size="lg"
                    label="OTP Code"
                    className="max-w-xs"
                    variant="bordered"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    {...field}
                  />
                )}
              />
            )}
          </>
        ) : (
          <div className="min-h-64 grid place-content-center">
            {state.step !== 3 && state.qrCode && <QrCode qrCode={state.qrCode} />}

            {state.step !== 3 && !state.qrCode && <Spinner className="size-10" />}
          </div>
        )}

        {state.step === 3 && (
          <Controller
            name="password"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState: { error } }) => (
              <Input
                isRequired
                size="lg"
                label="2FA password"
                className="max-w-xs"
                variant="bordered"
                isInvalid={!!error}
                errorMessage={error?.message}
                type="password"
                {...field}
              />
            )}
          />
        )}

        <div className="flex flex-col gap-6 w-full items-center mt-4">
          {(state.loginType === "phone" || state.step === 3) && (
            <Button
              type="submit"
              fullWidth
              variant="filledTonal"
              isLoading={state.isLoading}
              className="max-w-xs text-inherit"
            >
              {state.isLoading ? "Please Wait…" : state.step === 1 ? "Next" : "Login"}
            </Button>
          )}
          {state.step !== 3 && (
            <Button
              onPress={() =>
                setState((prev) => ({
                  ...prev,
                  loginType: prev.loginType === "qr" ? "phone" : "qr",
                }))
              }
              fullWidth
              variant="filledTonal"
              className="max-w-xs text-inherit"
            >
              {state.loginType === "qr" ? "Phone Login" : "QR Login"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
});
