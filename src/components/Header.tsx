import React, {
  ChangeEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import ColorModeContext from "@/contexts/ColorMode"
import CancelIcon from "@mui/icons-material/Cancel"
import DarkIcon from "@mui/icons-material/DarkModeOutlined"
import LightIcon from "@mui/icons-material/LightModeOutlined"
import RestartIcon from "@mui/icons-material/RefreshOutlined"
import SearchIcon from "@mui/icons-material/Search"
import { Box, Grid, Tooltip, Typography } from "@mui/material"
import AppBar from "@mui/material/AppBar"
import IconButton from "@mui/material/IconButton"
import InputBase from "@mui/material/InputBase"
import { styled, useTheme } from "@mui/material/styles"
import Toolbar from "@mui/material/Toolbar"
import { Link, useNavigate, useRouterState } from "@tanstack/react-router"
import debounce from "lodash.debounce"

import usePrevious from "@/hooks/usePrevious"
import { useSession } from "@/hooks/useSession"
import AccountMenu from "@/components/menus/Account"
import ColorMenu from "@/components/menus/Color"
import { usePreloadFiles } from "@/utils/queryOptions"

const PREFIX = "AppBar"

const classes = {
  search: `${PREFIX}-search`,
  searchIcon: `${PREFIX}-searchIcon`,
  inputRoot: `${PREFIX}-inputRoot`,
  inputInput: `${PREFIX}-inputInput`,
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  [`& .${classes.search}`]: {
    height: "48px",
    display: "flex",
    borderRadius: 6 * theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    width: "100%",
    maxWidth: "420px",
    color: theme.palette.text.primary,
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },

  [`& .${classes.searchIcon}`]: {
    padding: theme.spacing(1.25),
    height: "100%",
    display: "flex",
    alignItems: "center",
    color: theme.palette.text.primary,
  },

  [`& .${classes.inputRoot}`]: {
    color: theme.palette.text.primary,
    width: "90%",
  },

  [`& .${classes.inputInput}`]: {
    padding: theme.spacing(1.25),
    transition: theme.transitions.create("width"),
    color: theme.palette.text.primary,
    width: "100%",
    fontSize: "0.8em",
    [theme.breakpoints.up("sm")]: {
      fontSize: "1em",
    },
  },
}))

const cleanSearchInput = (input: string) => input.trim().replace(/\s+/g, " ")

const SearchBar = () => {
  const { location } = useRouterState()

  const [type, search] = useMemo(() => {
    const parts = location.pathname.split("/")
    return [parts[1], parts.length > 2 ? decodeURIComponent(parts[2]) : ""]
  }, [location.pathname])

  const prevType = usePrevious(type)

  const [query, setQuery] = useState("")

  const preloadFiles = usePreloadFiles()

  const debouncedSearch = useCallback(
    debounce(
      (newValue: string) => preloadFiles("/" + newValue, "search", false),
      1000
    ),
    []
  )

  const updateQuery = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
    const cleanInput = cleanSearchInput(event.target.value)
    if (cleanInput) {
      debouncedSearch(cleanInput)
    }
  }, [])

  useEffect(() => {
    if (prevType == "search" && type != prevType) setQuery("")
    else if (type == "search" && search) setQuery(search)
  }, [type, prevType, search])

  return (
    <Box className={classes.search}>
      <Box className={classes.searchIcon}>
        <SearchIcon />
      </Box>
      <InputBase
        placeholder="Search Drive...."
        classes={{
          root: classes.inputRoot,
          input: classes.inputInput,
        }}
        value={query}
        inputProps={{
          "aria-label": "search",
          enterKeyHint: "search",
          autoComplete: "off",
        }}
        onChange={updateQuery}
      />
      <Box className={classes.searchIcon}>
        <IconButton
          style={{ height: "35px", width: "35px" }}
          onClick={() => setQuery("")}
          size="large"
        >
          <CancelIcon />
        </IconButton>
      </Box>
    </Box>
  )
}

export default function Header({ auth }: { auth: boolean }) {
  const { palette } = useTheme()

  const { toggleColorMode, resetTheme } = useContext(ColorModeContext)

  const { data: session } = useSession()

  return (
    <StyledAppBar
      sx={{
        flexGrow: 1,
        backgroundColor: "background.default",
        maxHeight: 64,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      color="default"
      position="fixed"
    >
      <Toolbar sx={{ margin: "auto 0 auto 0" }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item>
            <Link to="/$" params={{ _splat: "my-drive" }}>
              <Typography
                color="inherit"
                sx={{
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  fontSize: 20,
                  textDecoration: "none",
                }}
              >
                TelDrive
              </Typography>
            </Link>
          </Grid>
          <Grid
            item
            xs
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-end",
            }}
          >
            {auth && <SearchBar />}
          </Grid>
          <Grid item>
            <ColorMenu />
          </Grid>
          <Grid item>
            <Tooltip title="Switch Theme">
              <IconButton
                size="large"
                color="inherit"
                onClick={toggleColorMode}
              >
                {palette.mode == "light" ? <DarkIcon /> : <LightIcon />}
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item>
            <Tooltip title="Reset">
              <IconButton size="large" color="inherit" onClick={resetTheme}>
                <RestartIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          {auth && (
            <Grid item>
              <AccountMenu />
            </Grid>
          )}
        </Grid>
      </Toolbar>
    </StyledAppBar>
  )
}
