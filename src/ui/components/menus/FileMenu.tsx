import * as React from "react"
import Menu from "@mui/material/Menu"
import { styled } from "@mui/material/styles"

const FileMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    {...props}
  />
))(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: "#E3E3E3",
    backgroundColor: "#121212",
    boxShadow:
      "rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
    "& .MuiMenu-list": {
      padding: "4px 0",
    },
    "& .MuiMenuItem-root": {
      "& .MuiSvgIcon-root": {
        fontSize: 18,
        color: "#E3E3E3",
        marginRight: theme.spacing(1.5),
      },
      "&:active": {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.08)",
      },
    },
  },
}))

export default FileMenu
