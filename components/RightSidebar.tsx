import Image from "next/image";
import Link from "next/link";
import BankCards from "./BankCards";

const RightSidebar = ({userLoggedIn, transactions, banks}: RightSidebarProps) => {
    console.log(banks.data[0].id);
    const bankClone = banks?.data;
    console.log("the right side bar");
      return (
    <aside className="right-sidebar">
        <section className="flex flex-col pb-8">
            <div className="profile-banner" />
            <div className="profile">
                <div className="profile-img">
                    <span className="text-5xl font-bold text-blue-500">{userLoggedIn.firstName[0]}</span>
                     </div>   
                    <div className="profile-details">
                        <h1 className="flex header-2">
                            {userLoggedIn.firstName} {userLoggedIn.lastName}
                        </h1>
                        <p className="profile-email">
                            {userLoggedIn.email}
                        </p>
                                
                </div>
            </div>
        </section>
        <section className="banks">
            <div className="flex w-full justify-between">
                <h2 className="header-2">
                    My Banks
                </h2>
                <Link href="/" className="flex gap-2">
                   <Image src="/icons/plus.svg" height={20} width={20} alt="plus" />
                   <h2 className="text-14 font-semibold text-gray-500">
                    Add Bank
                   </h2>
                </Link>
            </div>
            {bankClone?.length > 0 && (
                <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
                   <div className="relative z-10">
                     <BankCards key={bankClone[0].id} account={bankClone[0]} userName={`${userLoggedIn.firstName} ${userLoggedIn.lastName}`} showBalance={false} /> 
                   {bankClone[1] && (
                    <div className="absolute right-0 top-8 z-0 w-[90%]">
                      <BankCards key={bankClone[1]?.id} account={bankClone[1]} userName={`${userLoggedIn.firstName} ${userLoggedIn.lastName}`} showBalance={false} />
                   </div>
                   )}
                </div>
                </div>
            )
            }
        </section>
    </aside>
  )
}

export default RightSidebar;
