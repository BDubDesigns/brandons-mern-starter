interface Window {
  // Extend the Window interface to include the Clerk object, which
  // is used for authentication and user management in the frontend
  Clerk?: import("@clerk/shared/types").BrowserClerk;
}
