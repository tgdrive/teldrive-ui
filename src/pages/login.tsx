import dynamic from "next/dynamic"
import Loader from "@/ui/components/Loader"

const  SignIn = dynamic(() => import("@/ui/components/SignIn"), {
  ssr: false,
  loading: () => <Loader />,
})

export default function Login() {
  return <SignIn />
}
