import { SignUp } from "@clerk/react";
import { PageCentered } from "../components/PageCentered";

export const Register = () => {
  return (
    <PageCentered>
      <SignUp path="/register" routing="path" signInUrl="/login" />
    </PageCentered>
  );
};
