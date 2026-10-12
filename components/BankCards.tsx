"use client"
import { formatAmount } from "@/lib/utils"
import { Eye, EyeClosed, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

const BankCards = ({account, userName, showBalance = true}: CreditCardProps) => {
const [toggle, setToggle] = useState<true|false>(false);

function handleToggle() {
    setToggle(prev => !prev);
}
  return (
    <div className="flex flex-col">
        <Link href="/" className="bank-card">
          <div className="bank-card_content">
                <h1 className="text-16 font-semibold text-white">
                    {userName}
                </h1>
                <div onClick={handleToggle}>
                 {toggle ? (<p className="font-ibm-plex-serif font-black text-white flex gap-2">
                    {(formatAmount(account.currentBalance))}{" "}<Eye />
                </p>): (
                  <p className="font-ibm-plex-serif font-black text-white flex gap-2">
                    $ *******.**{" "}<EyeOff />
                  </p>
                )}
                </div>
                <article className="flex flex-col mt-12 gap-2">
                    <div className="flex justify-between">
                        <h1 className="text-12 font-semibold text-white">
                            {userName}
                        </h1>
                        <h2 className="text-12 font-semibold text-white">
                            &#9679;&#9679; / &#9679;&#9679;
                        </h2>
                    </div>
                    <p className="text-14 font-semibold tracking-[1.1px] text-white">
                      &#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679; &#9679;&#9679;&#9679;&#9679; <span className="text-16">1234</span>
                    </p>
                </article>
            
          </div>
          <div className="bank-card_icon">
            <Image src="/icons/Paypass.svg" alt="Paypass" width={20} height={20} className="absolute top-4 right-3"/>
            <Image src="/icons/mastercard.svg" alt="Mastercard" width={40} height={40} className="absolute ml-5 bottom-2 right-1"/>
            </div>
            <Image src="/icons/lines.png" width={316} height={190} alt="lines" className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover" />
        </Link>
      
    </div>
  )
}

export default BankCards
