import { FC, memo } from "react"
import { Box } from "@mui/material"

const PDFEmbedPreview: FC<{ mediaUrl: string }> = ({ mediaUrl }) => {
  const url = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${mediaUrl}`
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
      <Box
        component={"iframe"}
        title="PdfView"
        sx={{ border: "none", borderRadius: 8 }}
        src={url}
        width="100%"
        height="100%"
        allowFullScreen
      />
    </Box>
  )
}

export default memo(PDFEmbedPreview)
