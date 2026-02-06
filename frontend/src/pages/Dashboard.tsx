import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { PageCard } from "../components/PageCard";

export const Dashboard = () => {
  const auth = useAuth();

  const handleLogout = () => {
    auth.logout();
    // automatically redirected to login by ProtectedRoute
  };
  if (auth.loading) {
    console.log("loading");
    return <div>Loading...</div>;
  }
  if (!auth.user) {
    console.log("This shouldn't be possible.");
    return <div>This shouldn't be possible. Please contact support.</div>;
  }
  return (
    <PageCard title="Dashboard" subtitle={`Welcome, ${auth.user.name}`}>
      <div>
        <p className="mb-2 text-xl">Your email: {auth.user.email}</p>
      </div>
      <div>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </PageCard>
  );
};
