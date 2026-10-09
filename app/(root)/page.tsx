import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getLoggedInUser } from '@/app/api/auth/sign-in/route';
const Home = async () => {
      const users = await getLoggedInUser();
      console.log("the data was");
      console.log(users);
      const loggedIn = {firstName: users.firstname, lastName: users.lastname, email: users.email};
    //const loggedIn = {firstName: data.firstname, lastName: data.lastname, email: data.email};

  return (
    <section className="home">
    <div className="home-content">
      <header className="home-header">
       <HeaderBox 
        type="greeting"
        title="Welcome"
        user={loggedIn?.firstName || 'Guest'}
        subtext="Access and manage your account and transactions efficiently"
       />
       <TotalBalanceBox accounts={[]} totalBanks={1} totalCurrentBalance={1250.35} />
      </header>
      RECENT TRANSACTIONS
    </div>
    <RightSidebar 
    userLoggedIn={loggedIn}
    transactions={[]}
    banks={[{currentBalance: 123.50}, {currentBalance: 500.50}]}
    />
    </section>
  )
}

export default Home;

