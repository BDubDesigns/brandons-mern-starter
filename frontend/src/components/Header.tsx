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

  // Define the visual style for interactive elements (Buttons/Links)
  // Moved 'flex h-full items-center' here ensures the content centers within the button
  const interactiveClass =
    "flex h-full w-full items-center p-2 m-2 rounded-lg border-2 border-border bg-interactive hover:bg-interactive-hover text-text cursor-pointer";

  // theme button element
  const themeButton = (
    <button
      className={interactiveClass}
      aria-label="Cycle theme"
      onClick={cycleTheme}
    >
      {getThemeIcon(choice)}
    </button>
  );

  // conditionally generate a list of nav items based on auth state
  const navItems = user
    ? [
        { label: user.name, type: "span" },
        { label: "Profile", type: "link", to: "/profile" },
        { label: "Logout", type: "button", onClick: logout },
      ]
    : [
        { label: "Login", type: "link", to: "/login" },
        { label: "Register", type: "link", to: "/register" },
      ];

  return (
    <header className="bg-surface text-text border-border mb-2 border-b-2 font-semibold">
      {/* Desktop nav */}
      <nav className="hidden h-14 items-center md:flex">
        <ul className="flex w-full items-center">
          <li className="ml-2 font-bold">MERN-Starter</li>

          {navItems.map((item, index) => (
            <li
              key={index}
              className={`flex items-center ${index === 0 ? "ml-auto" : ""}`}
            >
              {item.type === "link" && item.to && (
                <Link className={interactiveClass} to={item.to}>
                  {item.label}
                </Link>
              )}
              {item.type === "button" && item.onClick && (
                <button className={interactiveClass} onClick={item.onClick}>
                  {item.label}
                </button>
              )}
              {item.type === "span" && (
                <span className="m-2 p-2">{item.label}</span>
              )}
            </li>
          ))}
          {/* Theme button needs to be wrapped in a flex item to align correctly. I'd be lying if I said I fully understandy why.*/}
          <li className="flex items-center">{themeButton}</li>
        </ul>
      </nav>

      {/* Mobile nav */}
      <nav className="md:hidden">
        <div className="bg-surface text-text border-border flex items-center border-b font-semibold">
          <span className="mr-auto flex pl-2 text-3xl font-bold">
            <Link to="/">MS</Link>
          </span>
          <span className="flex items-center">{themeButton}</span>
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
              {navItems.map(
                (item, index) =>
                  item.type !== "span" && (
                    <li
                      key={index}
                      className="border-border flex h-11 items-center border-b pl-2"
                    >
                      {item.type === "link" && item.to && (
                        <Link
                          className="flex h-full w-full items-center"
                          to={item.to}
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      )}
                      {item.type === "button" && item.onClick && (
                        <button
                          className="flex h-full w-full cursor-pointer items-center text-left"
                          onClick={() => {
                            item.onClick();
                            setIsMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      )}
                    </li>
                  ),
              )}
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};
