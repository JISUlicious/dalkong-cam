import "../../common/styles/App.scss";
import "../../common/styles/Auth.scss";
import React, { useState } from "react";
import { AuthForm } from "./AuthForm";
import { Link, useNavigate } from "react-router-dom";
import { signUpEmail } from "../../common/functions/auth";

export function SignUp () {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signUpEmail(inputId, inputPw)
      .then(() => navigate("/"))
      .catch((error: React.ErrorInfo) => {
        console.log(error);
      });
  }
  return <div className="auth body-content">
    <h1>Create New Account</h1>
    <AuthForm buttonText="Sign Up" setInputId={setInputId} setInputPw={setInputPw} onSubmit={onSubmit} />
    <Link to="/sign-in">
      <button className={"sign-up text-only-button"}>
        or click here to sign in if you already have an account
      </button>
    </Link>
  </div>;
}