import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { AuthMessage, Message } from "@/ui/types"
import { Box, Checkbox, FormControlLabel, TextField } from "@mui/material"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grow from "@mui/material/Grow"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { matchIsValidTel, MuiTelInput } from "mui-tel-input"
import { Controller, useForm } from "react-hook-form"
import useWebSocket from "react-use-websocket"

import useSettings from "@/ui/hooks/useSettings"
import http from "@/ui/utils/http"

import QrCode from "./QRCode"
import TelegramIcon from "./TelegramIcon"

type FormState = {
  phoneCodeHash?: string
  phoneCode: string
  phoneNumber: string
  remember?: boolean
}

export default function SignIn() {
  const { settings } = useSettings()

  const [isLoading, setLoading] = useState(false)

  const [formState, setFormState] = useState<FormState>({
    phoneCodeHash: "",
    phoneCode: "",
    phoneNumber: "",
    remember: true,
  })

  const { control, handleSubmit } = useForm({
    defaultValues: formState,
  })

  const [step, setStep] = useState(0)

  const [loginType, setLoginType] = useState("qr")

  const [qrCode, setqrCode] = useState("")

  const getWebSocketUrl = useCallback((apiHost: string) => {
    const host = apiHost ? apiHost : window.location.origin
    const url = new URL(host)
    return `${url.protocol === "http:" ? "ws" : "wss"}://${url.host}`
  }, [])

  const { sendJsonMessage, lastJsonMessage, readyState } =
    useWebSocket<AuthMessage>(
      `${getWebSocketUrl(settings.apiUrl)}/api/auth/ws`,
      {}
    )

  const router = useRouter()

  const { from } = router.query

  const postLogin = useCallback(
    async function postLogin(payload: Record<string, any>) {
      const res = (await http.post<Message>("/api/auth/login", payload)).data
      if (res.status) {
        //@ts-ignore
        window.location.href = from ? from : "my-drive"
      }
    },
    [from]
  )

  async function onSubmit({ phoneNumber, remember, phoneCode }: FormState) {
    if (step === 0) {
      setLoading(true)
      setFormState((prev) => ({
        ...prev,
        phoneNumber,
        remember,
      }))
      sendJsonMessage({
        authType: loginType,
        message: "sendcode",
        phoneNo: phoneNumber,
      })
    }
    if (step === 1) {
      setLoading(true)
      sendJsonMessage({
        authType: loginType,
        message: "signin",
        phoneNo: phoneNumber,
        phoneCode,
        phoneCodeHash: formState.phoneCodeHash,
      })
    }
  }

  const firstCall = useRef(false)

  useEffect(() => {
    if (loginType === "qr" && !firstCall.current) {
      sendJsonMessage({ authType: loginType })
      firstCall.current = true
    }
  }, [loginType, router])

  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage.message === "success") {
        postLogin(lastJsonMessage.payload)
        setLoading(false)
      }

      if (lastJsonMessage.payload.phoneCodeHash) {
        const phoneCodeHash = lastJsonMessage.payload.phoneCodeHash as string
        setFormState((prev) => ({ ...prev, phoneCodeHash }))
        setStep(1)
        setLoading(false)
      }
      if (lastJsonMessage.payload.token) {
        setqrCode(lastJsonMessage.payload.token as string)
      }
    }
  }, [lastJsonMessage])

  return (
    <Container component="main" maxWidth="sm">
      <Paper
        sx={{
          borderRadius: 2,
          px: 4,
          py: 6,
          marginTop: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <Typography component="h1" variant="h5">
          {loginType == "qr" ? "Login By QR code" : "Login By Phone Number "}
        </Typography>
        {loginType == "phone" && (
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={!isLoading ? handleSubmit(onSubmit) : undefined}
            sx={{
              width: "90%",
              gap: "1rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Grow in={true}>
              <Box
                sx={{
                  width: 150,
                  height: 150,
                  position: "relative",
                  margin: "auto",
                }}
              >
                <TelegramIcon />
              </Box>
            </Grow>
            {step === 0 && (
              <>
                <Controller
                  name="phoneNumber"
                  control={control}
                  rules={{ validate: matchIsValidTel }}
                  render={({ field, fieldState }) => (
                    <MuiTelInput
                      {...field}
                      defaultCountry="IN"
                      fullWidth
                      required
                      label="PhoneNo"
                      helperText={fieldState.invalid ? "Tel is invalid" : ""}
                      error={fieldState.invalid}
                    />
                  )}
                />
                <Controller
                  name="remember"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Checkbox {...field} checked={!!field.value} />}
                      label="Keep me signed in"
                    />
                  )}
                />
              </>
            )}
            {step === 1 && (
              <>
                <Controller
                  name="phoneCode"
                  control={control}
                  rules={{ required: true }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      margin="normal"
                      required
                      fullWidth
                      error={!!error}
                      type="text"
                      label="PhoneCode"
                      helperText={error ? error.message : ""}
                    />
                  )}
                />
              </>
            )}
            <Button
              type="submit"
              fullWidth
              variant="tonal"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? "Please Wait…" : step === 0 ? "Next" : "Login"}
            </Button>

            <Button
              onClick={() => setLoginType("qr")}
              fullWidth
              variant="tonal"
              sx={{ mb: 2 }}
            >
              Login By QR Code
            </Button>
          </Box>
        )}

        {loginType == "qr" && (
          <Box
            sx={{
              width: "90%",
              gap: "1rem",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                height: 280,
                width: 280,
                margin: "0 auto",
                maxWidth: 280,
                position: "relative",
              }}
            >
              {qrCode ? (
                <QrCode qrCode={qrCode} />
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    marginRight: "-50%",
                    transform: "translate(-50%,-50%)",
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
            </Box>

            <Button
              onClick={() => setLoginType("phone")}
              fullWidth
              variant="tonal"
              sx={{ mt: 3, mb: 2 }}
            >
              Login By Phone Number
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  )
}
