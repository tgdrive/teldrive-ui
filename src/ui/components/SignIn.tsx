import { useCallback, useEffect, useRef, useState } from "react"
import { AuthMessage, Message } from "@/ui/types"
import { Box, Checkbox, FormControlLabel, TextField } from "@mui/material"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grow from "@mui/material/Grow"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useQueryClient } from "@tanstack/react-query"
import { matchIsValidTel, MuiTelInput } from "mui-tel-input"
import { Controller, useForm } from "react-hook-form"
import { toast } from "react-hot-toast"
import { useLocation, useNavigate } from "react-router-dom"
import useWebSocket from "react-use-websocket"

import useSettings from "@/ui/hooks/useSettings"
import http from "@/ui/utils/http"

import QrCode from "./QRCode"
import TelegramIcon from "./TelegramIcon"

type FormState = {
  phoneCodeHash?: string
  phoneCode: string
  phoneNumber: string
  password?: string
  remember?: boolean
}

type LoginType = "qr" | "phone"

export default function SignIn() {
  const { settings } = useSettings()

  const [isLoading, setLoading] = useState(false)

  const [formState, setFormState] = useState<FormState>({
    phoneCodeHash: "",
    phoneCode: "",
    phoneNumber: "",
    password: "",
    remember: true,
  })

  const { control, handleSubmit } = useForm({
    defaultValues: formState,
  })

  const [step, setStep] = useState(1)

  const [loginType, setLoginType] = useState<LoginType>("phone")

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

  const location = useLocation()

  const navigate = useNavigate()

  const from = location.state?.from?.pathname || "/"

  const queryClient = useQueryClient()

  const postLogin = useCallback(
    async function postLogin(payload: Record<string, any>) {
      const res = (await http.post<Message>("/api/auth/login", payload)).data
      if (res.status) {
        await queryClient.invalidateQueries(["session"])
        navigate(from ? from : "/my-drive", { replace: true })
      }
    },
    [from]
  )

  const onSubmit = useCallback(
    ({ phoneNumber, remember, phoneCode, password }: FormState) => {
      if (step === 1 && loginType == "phone") {
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
      if (step === 2 && loginType == "phone") {
        setLoading(true)
        sendJsonMessage({
          authType: loginType,
          message: "signin",
          phoneNo: phoneNumber,
          phoneCode,
          phoneCodeHash: formState.phoneCodeHash,
        })
      }
      if (step === 3) {
        setLoading(true)
        sendJsonMessage({
          authType: "2fa",
          password,
        })
      }
    },
    [formState, loginType, step]
  )

  const firstCall = useRef(false)

  useEffect(() => {
    if (loginType === "qr" && !firstCall.current) {
      sendJsonMessage({ authType: loginType })
      firstCall.current = true
    }
  }, [loginType])

  useEffect(() => {
    if (lastJsonMessage !== null) {
      if (lastJsonMessage?.message === "success") {
        postLogin(lastJsonMessage.payload)
        setLoading(false)
      }

      if (lastJsonMessage?.payload?.phoneCodeHash) {
        const phoneCodeHash = lastJsonMessage.payload.phoneCodeHash as string
        setFormState((prev) => ({ ...prev, phoneCodeHash }))
        setStep(2)
        setLoading(false)
      }
      if (lastJsonMessage?.payload?.token) {
        setqrCode(lastJsonMessage.payload.token as string)
      }

      if (lastJsonMessage?.message === "2FA required") {
        setLoading(false)
        setStep(3)
      }

      if (lastJsonMessage.type === "error") {
        toast.error(lastJsonMessage.message)
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
          {loginType == "qr" ? "Login By QR code" : "Login By Phone"}
        </Typography>
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
          {loginType == "phone" && step !== 3 && (
            <>
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
              {step === 1 && (
                <>
                  <Controller
                    name="phoneNumber"
                    control={control}
                    rules={{ validate: matchIsValidTel as any }}
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
                        control={
                          <Checkbox {...field} checked={!!field.value} />
                        }
                        label="Keep me signed in"
                      />
                    )}
                  />
                </>
              )}
              {step === 2 && (
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
            </>
          )}
          {loginType == "qr" && step !== 3 && (
            <>
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
            </>
          )}
          {step === 3 && (
            <>
              <Controller
                name="password"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    error={!!error}
                    type="password"
                    label="2FA password"
                    helperText={error ? error.message : ""}
                  />
                )}
              />
            </>
          )}
          {(loginType == "phone" || step == 3) && (
            <Button
              type="submit"
              fullWidth
              variant="tonal"
              disabled={isLoading}
              sx={{ mt: 3, mb: 2 }}
            >
              {isLoading ? "Please Wait…" : step === 1 ? "Next" : "Login"}
            </Button>
          )}
          {step !== 3 && (
            <Button
              onClick={() => setLoginType(loginType === "qr" ? "phone" : "qr")}
              fullWidth
              variant="tonal"
              sx={{ mb: 2 }}
            >
              {`Login By ${loginType === "qr" ? "Phone" : "QR Code"}`}
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  )
}
