import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router";
import { MdBrightness7, MdBrightness4, MdBrightnessAuto } from "react-icons/md";

// helper function to get icon for theme choice
const getThemeIcon = (choice: "light" | "dark" | null) => {
  if (choice === "light") return <MdBrightness7 />;
  if (choice === "dark") return <MdBrightness4 />;
  return <MdBrightnessAuto size="20" />; // null means "os"
};

export const Header = () => {
  // get auth and theme context
  const { user, logout } = useAuth();
  const { choice, cycleTheme } = useTheme();

  const themeButton = (
    <button aria-label="Cycle theme" onClick={cycleTheme}>
      {getThemeIcon(choice)}
    </button>
  );
  return (
    <header className="bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
      <nav>
        <ul className="flex h-12 items-center space-x-4 p-2">
          {user ? (
            <>
              <li>
                <span>Welcome, {user.name}!</span>
              </li>
              <li>
                <button onClick={logout}>Logout</button>
              </li>
              <li>
                <Link to="/profile">Profile</Link>
              </li>
              <li className="items-center">{themeButton}</li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
              <li>{themeButton}</li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
