import { SignIn } from "@clerk/react";

export const Login = () => {
  return <SignIn path="/login" routing="path" signUpUrl="/register" />;
};
