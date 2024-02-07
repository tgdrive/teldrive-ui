import { FC, memo } from "react"
import { Box } from "@mui/material"

const DocPreview: FC<{ mediaUrl: string }> = ({ mediaUrl }) => {
  const url = `https://view.officeapps.live.com/op/view.aspx?src=${mediaUrl}`

  return (
    <Box
      component={"iframe"}
      title="DocView"
      sx={{
        position: "relative",
        border: "none",
        zIndex: 101,
      }}
      src={url}
      width="100%"
      height="100%"
      allowFullScreen
    />
  )
}

export default memo(DocPreview)
