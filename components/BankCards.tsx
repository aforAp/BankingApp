import { formatAmount } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
const BankCards = ({account, userName, showBalance = true}: CreditCardProps) => {
  return (
    <div className="flex flex-col">
        <Link href="/" className="bank-card">
          <div className="bank-card_content">
                <h1 className="text-16 font-semibold text-white">
                    {account.name || userName}
                </h1>
                <p className="font-ibm-plex-serif font-black text-white">
                    {formatAmount(account.currentBalance)}
                </p>
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
