import { FC, memo } from "react"
import { Box } from "@mui/material"

const ImagePreview: FC<{ name: string; mediaUrl: string }> = ({
  name,
  mediaUrl,
}) => {
  return (
    <Box
      sx={{
        maxWidth: "70%",
        width: "100%",
        margin: "auto",
        padding: "1rem",
        position: "relative",
        display: "grid",
        placeContent: "center",
      }}
    >
      <Box
        component={"img"}
        src={mediaUrl}
        alt={name}
        sx={{ maxWidth: "100%", height: "auto" }}
      />
    </Box>
  )
}

export default memo(ImagePreview)
