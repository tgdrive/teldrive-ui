import { FC } from "react"
import { Typography } from "@mui/material"

interface ArtistNameProps {
  artist: string
}

const ArtistName: FC<ArtistNameProps> = ({ artist }) => {
  return (
    <Typography
      variant="h6"
      component="h2"
      mb={1}
      textAlign="center"
      color="primary"
    >
      {artist}
    </Typography>
  )
}

export default ArtistName
