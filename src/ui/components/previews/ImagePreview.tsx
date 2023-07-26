import { FC, memo } from "react"
import { Box } from "@mui/material"

import { getMediaUrl } from "@/ui/utils/common"

const ImagePreview: FC<{ id: string; name: string }> = ({ id, name }) => {
  const url = getMediaUrl(id, name)
  return (
    <Box
      sx={{
        maxWidth: "70%",
        width: "100%",
        margin: "auto",
        padding: "1rem",
        position: "relative",
      }}
    >
      <img src={url} alt={name} style={{ maxWidth: "100%", height: "auto" }} />
    </Box>
  )
}

export default memo(ImagePreview)
