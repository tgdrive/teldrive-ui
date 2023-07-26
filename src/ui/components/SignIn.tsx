import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { Message } from "@/ui/types"
import { Box, Checkbox, FormControlLabel, TextField } from "@mui/material"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Container from "@mui/material/Container"
import Grow from "@mui/material/Grow"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import base64url from "base64url"
import { matchIsValidTel, MuiTelInput } from "mui-tel-input"
import { Controller, useForm } from "react-hook-form"
import { Api, Logger, TelegramClient } from "telegram"
import { LogLevel } from "telegram/extensions/Logger"
import { Session, StringSession } from "telegram/sessions"

import { useSession } from "@/ui/hooks/useSession"
import { apiCredentials, getServerAddress } from "@/ui/utils/common"
import http from "@/ui/utils/http"

import QrCode from "./QRCode"
import TelegramIcon from "./TelegramIcon"

type FormState = {
  phoneCodeHash?: string
  phoneCode: string
  phoneNumber: string
  remember?: boolean
}

function getSession(session: Session, user: Api.User): Record<string, any> {
  const dc_id = session.dcId
  const auth_key = session.getAuthKey()?.getKey()?.toString("hex")

  return {
    dc_id,
    auth_key,
    tg_id: Number(user.id),
    bot: user.bot,
    user_name: user.username,
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    is_premium: user.premium,
  }
}

export default function SignIn() {
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

  const [isConnected, setIsConnected] = useState(false)

  const [qrCode, setqrCode] = useState("")

  const { refetch } = useSession()

  const clientRef = useRef<TelegramClient>(null)

  const router = useRouter()

  const { from } = router.query

  const postLogin = useCallback(
    async function postLogin(session: Session, user: Api.User) {
      let payload = getSession(session, user)
      const gramjs_session = session.save()
      payload["gramjs_session"] = gramjs_session
      const res = await http
        .post("/api/auth/login", { json: payload })
        .json<Message>()
      if (res.status) {
        await refetch()
        const toPath = from ?? "/my-drive"
        router.replace(toPath as string)
      }
    },
    [from]
  )

  async function onSubmit({ phoneNumber, remember, phoneCode }: FormState) {
    const client = clientRef.current!

    if (step === 0) {
      setLoading(true)
      try {
        const { phoneCodeHash } = await client.sendCode(
          apiCredentials,
          phoneNumber
        )
        setFormState((prev) => ({
          ...prev,
          phoneCodeHash,
          phoneNumber,
          remember,
        }))
        setStep(1)
      } catch (error) {
        //createToast(error.message, "error")
      } finally {
        setLoading(false)
      }
    }

    if (step === 1) {
      setLoading(true)
      try {
        let user = await client.invoke(
          new Api.auth.SignIn({
            phoneNumber: formState.phoneNumber,
            phoneCodeHash: formState.phoneCodeHash,
            phoneCode,
          })
        )
        await postLogin(client.session, user.user)
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!clientRef.current) {
      const session = new StringSession("")
      const { id, ipAddress, port } = getServerAddress(5)
      session.setDC(id, ipAddress, port)
      clientRef.current = new TelegramClient(
        session,
        apiCredentials.apiId,
        apiCredentials.apiHash,
        {
          baseLogger: new Logger(LogLevel.NONE),
          deviceModel: "Desktop",
          systemVersion: "Windows 10",
          appVersion: "4.8.1 x64",
          langCode: "en-US",
          useWSS: true,
        }
      )
      clientRef.current.connect().then(() => setIsConnected(true))
    }
    return () => {
      clientRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    const client = clientRef.current!
    async function loginWithQr() {
      const user = await client.signInUserWithQrCode(apiCredentials, {
        onError: async function (p1) {
          console.log("error", p1)
          return true
        },
        qrCode: async (code) => {
          let qr = `tg://login?token=${base64url(code.token)}`
          setqrCode(qr)
        },

        password: async (hint) => {
          return "1111"
        },
      })
      await postLogin(client.session, user)
    }

    if (loginType === "qr" && isConnected) loginWithQr()
  }, [loginType, router, isConnected])

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
