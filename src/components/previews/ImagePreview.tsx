import { FC, memo, useState } from "react"
import { Box, CircularProgress } from "@mui/material"

const ImagePreview: FC<{ name: string; mediaUrl: string }> = ({
  name,
  mediaUrl,
}) => {
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const handleImageOnLoad = () => {
    setIsLoaded(true)
  }

  return (
    <Box
      sx={{
        maxWidth: "64rem",
        maxHeight: "calc(100vh - 4rem)",
        margin: "auto",
        padding: "1rem",
        position: "relative",
      }}
    >
      {!isLoaded && (
        <CircularProgress
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
      <Box
        onLoad={handleImageOnLoad}
        component={"img"}
        src={mediaUrl}
        alt={name}
        sx={{
          maxWidth: "100%",
          maxHeight: "100%",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 300ms ease",
          objectFit: "contain",
        }}
      />
    </Box>
  )
}

export default memo(ImagePreview)
