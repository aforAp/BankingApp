import { formatAmount } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { CircleDollarSign } from "lucide-react"
const BankCards = ({account, userName, showBalance = true}: CreditCardProps) => {
  return (
    <div className="flex flex-col">
        <Link href="/" className="bank-card">
          <div className="bank-card_content">
            <div>
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
                            ** / **
                        </h2>
                    </div>
                    <p className="text-14 font-semibold tracking-[1.1px] text-white">
                      **** **** **** <span className="text-16">{account.mask}</span>
                    </p>
                    <div className="bank-card_icon">
                    <CircleDollarSign width={20} height={24} color="white"/>
            </div>
                </article>
                
            </div>
            
          </div>
        </Link>
      
    </div>
  )
}

export default BankCards
