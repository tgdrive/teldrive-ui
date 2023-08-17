import { FC, memo } from "react"
import { Box } from "@mui/material"

const PDFEmbedPreview: FC<{ id: string; name: string }> = ({ id, name }) => {
  const pdfPath = encodeURIComponent(
    `${window.location.origin}/api/files/${id}/${name}`
  )
  const url = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${pdfPath}`

  return (
    <Box
      sx={{
        maxWidth: "70%",
        width: "100%",
        margin: "auto",
        padding: "1rem",
        position: "relative",
        height: "90vh",
      }}
    >
      <iframe
        style={{ border: "none", borderRadius: 8 }}
        src={url}
        width="100%"
        height="100%"
        allowFullScreen
      />
    </Box>
  )
}

export default memo(PDFEmbedPreview)
