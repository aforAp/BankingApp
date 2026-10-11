
import Sidebar from "@/components/Sidebar";
import "../globals.css";
import Image from "next/image";
import MobileNavBar from "@/components/MobileNavBar";
import { getLoggedInUser } from '@/app/api/auth/sign-in/route';
import { redirect } from "next/navigation";

type UserDetail = {
  firstName: string,
  lastName: string,
  email: string,
}

export default async function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
      const users = await getLoggedInUser();
      
      if(!users) {
        redirect('/sign-in');
      }
      const loggedIn: UserDetail = {firstName: users.firstname, lastName: users.lastname, email: users.email};
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
