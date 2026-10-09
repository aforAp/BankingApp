
import Sidebar from "@/components/Sidebar";
import "../globals.css";
import Image from "next/image";
import MobileNavBar from "@/components/MobileNavBar";
import { getLoggedInUser } from '@/app/api/auth/sign-in/route';

type UserDetails = {
  firstName: string,
  lastName: string,
  email: string,
}

export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
      const users = await getLoggedInUser();
      const loggedIn: UserDetails = {firstName: users.firstname, lastName: users.lastname, email: users.email};
console.log(loggedIn);
  return (
    <main className="flex h-screen w-full font-inter">
        <Sidebar user={loggedIn} />
        <div className="flex size-full flex-col">
          <div className="root-layout">
            <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
            <div>
              <MobileNavBar user={loggedIn} />
            </div>
          </div>
         {children}
        </div>
    </main>
  );
}
