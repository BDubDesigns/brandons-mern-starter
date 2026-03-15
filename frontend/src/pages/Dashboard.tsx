import { Button } from "../components/Button";
import { PageCard } from "../components/PageCard";
import { useUser, useClerk } from "@clerk/react";

export const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut();
  };
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <div>This shouldn't be possible. Please contact support.</div>;
  }
  return (
    <PageCard
      title="Dashboard"
      subtitle={`Welcome, ${user.fullName ?? user.primaryEmailAddress?.emailAddress}`}
    >
      <div>
        <p className="mb-2 text-xl">
          Your email: {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
      <div>
        <Button className="w-full" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </PageCard>
  );
};
