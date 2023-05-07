import "../../common/styles/App.scss";
import "../../common/styles/Auth.scss";
import React, { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Link, useNavigate } from "react-router-dom";
import { signInEmail } from "../../common/functions/auth";

export function SignIn () {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signInEmail(inputId, inputPw)
      .then(() => navigate("/"))
      .catch((error: React.ErrorInfo) => {
        console.log(error);
      });

  }
  return <div className="auth body-content">
    <h1>Sign with Your Account</h1>

    <AuthForm buttonText="Sign In" setInputId={setInputId} setInputPw={setInputPw} onSubmit={onSubmit} />
    <Link to="/sign-up">
      <button className={"sign-up text-only-button"}>
        or click here to sign up for new account
      </button>
    </Link>
  </div>;
}