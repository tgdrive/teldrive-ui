import React, { useEffect, useRef, useState } from "react"
import { Box, Grow, useTheme } from "@mui/material"
import QRCodeStyling from "qr-code-styling"
import { useAsyncMemo } from "use-async-memo"

const QR_SIZE = 280

export default function QrCode({ qrCode }: { qrCode: string }) {
  const ref = useRef(null)

  const theme = useTheme()

  const [isQrMounted, setisQrMounted] = useState(false)

  const qrStyle = useAsyncMemo(async () => {
    return new QRCodeStyling({
      width: QR_SIZE,
      height: QR_SIZE,
      margin: 10,
      type: "svg",
      dotsOptions: {
        color: theme.palette.text.primary,
        type: "rounded",
      },
      cornersSquareOptions: {
        type: "extra-rounded",
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 2,
      },
      backgroundOptions: {
        color: theme.palette.background.paper,
      },
      qrOptions: {
        errorCorrectionLevel: "M",
      },
    })
  }, [theme.palette])

  useEffect(() => {
    if (ref.current && qrStyle) {
      qrStyle.append(ref.current)
      setisQrMounted(true)
    }
  }, [qrStyle])

  useEffect(() => {
    if (!qrCode) return
    if (qrStyle) qrStyle.update({ data: qrCode })
  }, [qrCode, qrStyle])

  return (
    <Grow in={isQrMounted}>
      <Box ref={ref} sx={{ height: "auto", maxWidth: "100%", width: "100%" }} />
    </Grow>
  )
}
