import { useAuth } from "../context/AuthContext";

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
    <div>
      <h1>Dashboard</h1>
      <div>
        <h2>Welcome, {auth.user.name}!</h2>
        <p>Your email: {auth.user.email}</p>
      </div>
      <div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};
