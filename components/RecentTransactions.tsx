import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BankTabItem } from './BankTabItem';
const RecentTransactions = ({
    accounts,
    transactions = [],
    id,
    page = 1
}: RecentTransactionsProps) => {
  return (
    <section className="recent-transactions">
        <header className="flex items-center justify-between">
            <h2 className="recent-transactions-label">
                Recent transactions
            </h2>
            <Link href={`/transaction-history/id=${id}`} className="view-all-btn">
              View All
            </Link>
        </header>
    <Tabs
      defaultValue={accounts[0]?.id}
      className="flex flex-col w-full text-black"
      orientation="vertical"
    >
        <TabsList className="recent-transactions-tablist">
            {accounts.map((account: Account) => (
                <TabsTrigger key={account.id} value={account.id}>
                  <BankTabItem 
                   key={account.id}
                   account={account}
                   id={account.id}
                  />
                </TabsTrigger>
            ))}
        </TabsList>
    </Tabs>
    </section>
  )
}

export default RecentTransactions;
