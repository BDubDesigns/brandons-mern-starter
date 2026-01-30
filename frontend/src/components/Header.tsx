import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router";
import { MdBrightness7, MdBrightness4, MdBrightnessAuto } from "react-icons/md";

// helper function to get icon for theme choice
const getThemeIcon = (choice: "light" | "dark" | null) => {
  if (choice === "light") return <MdBrightness7 size="24" />;
  if (choice === "dark") return <MdBrightness4 size="24" />;
  return <MdBrightnessAuto size="24" />; // null means "os"
};

export const Header = () => {
  // get auth and theme context
  const { user, logout } = useAuth();
  const { choice, cycleTheme } = useTheme();

  const themeButton = (
    <button
      className="flex h-full w-full items-center justify-center"
      aria-label="Cycle theme"
      onClick={cycleTheme}
    >
      {getThemeIcon(choice)}
    </button>
  );

  const liClass =
    "flex h-full items-center px-2 m-2 rounded-sm dark:hover:bg-zinc-900 hover:bg-zinc-300";
  return (
    <header className="bg-zinc-200 font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
      <nav className="flex h-14 items-center">
        <ul className="flex h-12 items-center space-x-2">
          {user ? (
            <>
              {/* give the li a gradient background */}
              <li className="ml-2">
                <span>Welcome, {user.name}!</span>
              </li>
              <li className={liClass}>
                <button onClick={logout}>Logout</button>
              </li>
              <li className={liClass}>
                <Link to="/profile">Profile</Link>
              </li>
              <li className={liClass}>{themeButton}</li>
            </>
          ) : (
            <>
              <li className={liClass}>
                <Link to="/login">Login</Link>
              </li>
              <li className={liClass}>
                <Link to="/register">Register</Link>
              </li>
              <li className={liClass}>{themeButton}</li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
