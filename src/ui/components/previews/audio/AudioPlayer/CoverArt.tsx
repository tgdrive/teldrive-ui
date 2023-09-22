import { FC } from "react"
import { Box, CircularProgress } from "@mui/material"
import { useMediaQuery } from "usehooks-ts"

interface CoverArtProps {
  imageUrl: string
}

const CoverArt: FC<CoverArtProps> = ({ imageUrl }) => {
  const isM = useMediaQuery("(max-width:900px)")

  return (
    <Box
      sx={{
        maxWidth: isM ? "350px" : "500px",
        maxHeight: isM ? "350px" : "500px",
        width: 1,
        height: 1,
        px: 2,
      }}
    >
      <Box
        // onLoad={handleImageOnLoad}
        component={"img"}
        src={imageUrl}
        // alt={name}
        sx={{
          width: 1,
          margin: "auto",
          borderRadius: 1,
          // opacity: isLoaded ? 1 : 0,
          transition: "opacity 300ms ease-in 0ms",
        }}
      />
    </Box>
  )
}

export default CoverArt
