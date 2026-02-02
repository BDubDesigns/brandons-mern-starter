import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import { Link } from "react-router";
// import icons
import { MdBrightness7, MdBrightness4, MdBrightnessAuto } from "react-icons/md";
import { GiHamburgerMenu } from "react-icons/gi";

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
  // hambuger menu state (for mobile)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // nav item class for desktop
  const navClass =
    "flex h-full items-center p-2 m-2 rounded-lg border-2 border-border bg-interactive hover:bg-interactive-hover text-text";
  // nav item class for mobile
  const mobileNavClass = "border-border flex h-11 items-center border-b pl-2";

  // theme button element
  const themeButton = (
    <button className={navClass} aria-label="Cycle theme" onClick={cycleTheme}>
      {getThemeIcon(choice)}
    </button>
  );

  // conditionally generate a list of nav items based on auth state
  // this is to keep our component dumb, and only display whats given, not decide what to show

  return (
    <header className="bg-surface text-text border-border border-b-2 font-semibold">
      {/* Desktop nav */}
      <nav className="hidden h-14 items-center md:flex">
        <ul className="flex w-full items-center">
          <li className="ml-2 font-bold">MERN-Starter</li>

          {user ? (
            <>
              <li className="ml-auto">
                <span>Welcome, {user.name}!</span>
              </li>
              <li>
                <Link className={navClass} to="/profile">
                  Profile
                </Link>
              </li>
              <li>
                <button className={navClass} onClick={logout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="ml-auto">
                <Link className={navClass} to="/login">
                  Login
                </Link>
              </li>
              <li>
                <Link className={navClass} to="/register">
                  Register
                </Link>
              </li>
            </>
          )}

          <li>{themeButton}</li>
        </ul>
      </nav>

      {/* Mobile nav */}
      <nav className="md:hidden">
        <div className="bg-surface text-text border-border flex items-center border-b font-semibold">
          <span className="mr-auto flex pl-2 text-3xl font-bold">
            <Link to="/">MS</Link>
          </span>
          <span>{themeButton}</span>
          <span
            className="border-border bg-interactive hover:bg-interactive-hover m-2 rounded-lg border-2 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <GiHamburgerMenu size="24" />
          </span>
        </div>
        <ul>
          {isMenuOpen && (
            <>
              <li className={mobileNavClass}>Heres a link</li>
              <li className={mobileNavClass}>heres anothser</li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
