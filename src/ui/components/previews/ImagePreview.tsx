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

  console.log(isLoaded)
  return (
    <Box
      sx={{
        maxWidth: "70%",
        width: "auto",
        margin: "auto",
        padding: "1rem",
        position: "relative",
        display: "grid",
        placeContent: "center",
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
          height: "auto",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 300ms ease-in 0ms",
        }}
      />
    </Box>
  )
}

export default memo(ImagePreview)
