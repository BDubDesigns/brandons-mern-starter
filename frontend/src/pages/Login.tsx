import { SignIn } from "@clerk/react";
import { PageCentered } from "../components/PageCentered";

export const Login = () => {
  return (
    <PageCentered>
      <SignIn path="/login" routing="path" signUpUrl="/register" />
    </PageCentered>
  );
};
