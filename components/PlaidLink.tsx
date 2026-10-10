import { PlaidLinkOnSuccess, PlaidLinkOptions, usePlaidLink } from "react-plaid-link"
import { Button } from "./ui/button"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { createLinkToken } from "@/app/api/auth/sign-in/route";

const PlaidLink = ({user, variant}: PlaidLinkProps) => {

 const [token, setToken] = useState("");
const router = useRouter();
 useEffect(() => {
   const getLinkToken = async () => {
     const data = await createLinkToken(user);
   }
   getLinkToken();
 }, [user]);
  const onSuccess = useCallback<PlaidLinkOnSuccess>(async (public_token: string) => {
      //  await exchangePublicToken({
      //   publicToken: public_token,
      //   user,
      //  })
  }, [user]);

  const config: PlaidLinkOptions = {
    token,
    onSuccess
  }

  const {open, ready} = usePlaidLink(config);

  return (
    <>
      {variant === 'primary' ? (
       <Button 
       onClick={() => open()}
       disabled={!ready}
       className="plaidlink-primary">
        Connect Bank
       </Button>    
      ): variant === 'ghost'? (
         <Button>
        Connect bank
       </Button>
      ): (
        <Button>
            Connect bank
        </Button>
      )
    }
    </>
  )
}

export default PlaidLink
