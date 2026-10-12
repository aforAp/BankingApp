import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import PlaidLink from "@/components/PlaidLink";
import { getLoggedInUser } from '@/app/api/auth/sign-in/route';
import { getAccount, getAccounts } from "@/lib/bank.actions";
import RecentTransactions from "@/components/RecentTransactions";
const Home = async ({searchParams: {id, page}}: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
      const users = await getLoggedInUser();
      const loggedIn = {firstName: users.firstname, lastName: users.lastname, email: users.email};
    //const loggedIn = {firstName: data.firstname, lastName: data.lastname, email: data.email};
const accounts = await getAccounts({
  userId: users._id
});
console.log("the accounts are");
console.log(accounts);
if (!accounts) return null;
const firstAccount = accounts.data?.[0];
if (!firstAccount) return null;

const accountDetails = await getAccount({ accountId: firstAccount.id });
console.log("the account Details");
console.log(accountDetails);
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
       <TotalBalanceBox accounts={accounts.data} totalBanks={accounts.totalBanks} totalCurrentBalance={accounts.totalCurrentBalance} />
      </header>
      {accountDetails?.transactionsConsentRequired && (
        <div className="mt-4">
          <p role="status" className="mb-3 text-sm text-gray-500">
            Plaid requires your consent to access transactions for this bank.
          </p>
          <PlaidLink accountId={firstAccount.id} variant="ghost" />
        </div>
      )}
      {accountDetails?.transactionsUnavailable &&
        !accountDetails.transactionsConsentRequired && (
          <p role="status" className="mt-4 text-sm text-gray-500">
            Transactions are temporarily unavailable. Please try again later.
          </p>
        )}
          <RecentTransactions
            accounts={accounts.data}
            transactions={accountDetails?.transactions ?? []}
            id={firstAccount.id}
            page={currentPage}
          />
    </div>
    <RightSidebar
    userLoggedIn={loggedIn}
    transactions={accountDetails?.transactions ?? []}
    banks={accounts}
    />
    </section>
  )
}

export default Home;
