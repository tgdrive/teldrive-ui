import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"
import { Box, Button, Typography } from "@mui/material"
import { useTheme } from "@mui/material/styles"

const DefaultPreview = ({ mediaUrl }: { mediaUrl: string }) => {
  const theme = useTheme()
  return (
    <Box
      padding="20px"
      borderRadius="10px"
      width="400px"
      height="150px"
      position="absolute"
      top="50%"
      left="50%"
      maxWidth="100%"
      display="grid"
      sx={{
        placeContent: "center",
        transform: "translate(-50%, -50%)",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography mb={3} variant="h5">
        No preview available
      </Typography>
      <Button
        variant="outlined"
        startIcon={<FileDownloadOutlinedIcon />}
        onClick={() => {
          window.open(mediaUrl, "_blank")
        }}
      >
        Download
      </Button>
    </Box>
  )
}

export default DefaultPreview
