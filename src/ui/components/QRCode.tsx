import React, { useEffect, useMemo, useRef, useState } from "react"
import { Box, Grow, useTheme } from "@mui/material"
import QRCodeStyling from "qr-code-styling"
import { useAsyncMemo } from "use-async-memo"

import textToSvgURL from "@/ui/utils/common"

const QR_SIZE = 280

export default function QrCode({ qrCode }: { qrCode: string }) {
  const ref = useRef(null)

  const theme = useTheme()

  const [isQrMounted, setisQrMounted] = useState(false)

  const qrStyle = useAsyncMemo(async () => {
    let image = await fetch("/img/icons/icon.svg")
      .then((res) => res.text())
      .then((text) => {
        text = text.replace(
          /(circle.*)(fill=")(.*)(")/,
          `$1 $2${theme.palette.primary.main}$4`
        )
        text = text.replace(
          /(path.*)(fill=")(.*)(")/,
          `$1 $2${theme.palette.background.paper}$4`
        )
        return textToSvgURL(text)
      })
    return new QRCodeStyling({
      width: QR_SIZE,
      height: QR_SIZE,
      image,
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
