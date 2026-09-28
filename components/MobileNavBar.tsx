"use client"
import { useEffect, useState } from "react"
import {
  Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader,  SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
const MobileNavBar = ({user}: MobileNavProps) => {
    const pathName = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      const desktopQuery = window.matchMedia("(min-width: 48rem)");
      const closeOnDesktop = (event: MediaQueryList | MediaQueryListEvent) => {
        if (event.matches) setIsOpen(false);
      };

      closeOnDesktop(desktopQuery);
      desktopQuery.addEventListener("change", closeOnDesktop);
      return () => desktopQuery.removeEventListener("change", closeOnDesktop);
    }, []);

  return (
   <section className="w-full max-w-66">
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetTrigger>
    <Image src="/icons/hamburger.svg" width={30} height={30} alt="menu" className="cursor-pointer" />
  </SheetTrigger>
  <SheetContent side="left" className="border-none bg-white">
    <nav className="flex flex-col gap-4">
        <Link href="/" className="flex mb-12 cursor-pointer items-center gap-1 px-4">
        <Image src="/icons/logo.svg" width={34} height={34} alt="Horizon logo" />
        <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">Horizon</h1>
        </Link>
        <div className="mobilenav-sheet">
                <nav className="flex h-full flex-col gap-6 pt-16 text-white">
                  {sidebarLinks.map((item) => {
            const isActive = pathName === item.route || pathName.startsWith(`${item.route}/`)
            return (
                <SheetClose
                  key={item.route}
                  nativeButton={false}
                  render={
                    <Link href={item.route} className={cn('mobilenav-sheet_close w-full', {
                      'bg-bank-gradient': isActive
                    })} />
                  }
                >
                    <div className="relative size-6">
                    <Image src={item.imgURL} alt={item.label} width={20} height={20} className={cn({
                        'brightness-[3] invert-0': isActive
                    })}/>
                    </div>
                    <p className={cn("text-16 font-semibold text-black-2", {'text-white' :isActive})}>{item.label}</p>
              
            </SheetClose>
            )
        })}
         User
         
                </nav>
                
        </div>
     
      </nav>
  </SheetContent>
</Sheet>
   </section>
  )
}

export default MobileNavBar;
