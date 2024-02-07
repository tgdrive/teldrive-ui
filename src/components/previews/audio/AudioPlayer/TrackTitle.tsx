import { FC } from "react"
import { Typography } from "@mui/material"

interface TrackTitleProps {
  title: string
}

const TrackTitle: FC<TrackTitleProps> = ({ title }) => {
  return (
    <Typography variant="h6" component="h1" textAlign="center" mt={1}>
      {title}
    </Typography>
  )
}

export default TrackTitle
