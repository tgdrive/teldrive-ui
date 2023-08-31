import React, { FC } from "react"
import { useChonkyTheme } from "@bhunter179/chonky"
import CircularProgress from "@mui/material/CircularProgress"
import { makeStyles, useTheme } from "@mui/material/styles"
import Switch from "@mui/material/Switch"

type SwitchLoaderProps = {
  checked: boolean
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void
  loading?: boolean
}

const SwitchLoader: FC<SwitchLoaderProps> = ({
  checked,
  onChange,
  loading,
}) => {
  const theme = useTheme()
  // const [switchValue, setSwitchValue] = React.useState(false)
  // const [loading, setLoading] = React.useState(false)
  const styles = {
    circle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: checked ? 20 : 12,
      height: checked ? 20 : 12,
      borderRadius: "50%",
      backgroundColor: theme.palette.outline,
      boxShadow: theme.shadows[1],
    },
    active: {
      backgroundColor: theme.palette.primary.contrastText,
    },
  }

  // const handleChange = () => {
  //   setSwitchValue(!switchValue)
  //   setLoading(true)
  //   setTimeout(() => {
  //     setLoading(false)
  //   }, 2000)
  // }

  const Icon = () => (
    <div
      style={{
        ...styles.circle,
        ...(() => (checked && !loading ? styles.active : {}))(),
      }}
    >
      {loading && (
        <CircularProgress size={14} sx={{ color: "#fff" }} thickness={7} />
      )}
    </div>
  )

  return (
    <Switch
      checkedIcon={<Icon />}
      icon={<Icon />}
      // disabled={loading}
      checked={checked}
      onChange={onChange}
      value="checkedA"
      inputProps={{ "aria-label": "Switch with loading state" }}
    />
  )
}

export default SwitchLoader
