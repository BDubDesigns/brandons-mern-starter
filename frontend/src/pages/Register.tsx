import { SignUp } from "@clerk/react";

export const Register = () => {
  return <SignUp path="/register" routing="path" signInUrl="/login" />;
};
