import "../styles/App.scss";
import "../styles/Auth.scss";
import React from "react";
import {AuthForm} from "./AuthForm";
import {useNavigate} from "react-router-dom";

export function SignUp () {
  const navigate = useNavigate();
  return <div className="auth body-content">
    <h1>Create New Account</h1>
    <AuthForm signUp={true} />
    <button
      className={"sign-up text-only-button"}
      onClick={() => navigate("/")}
    >
      or click here to sigh in if you already have an account
    </button>
  </div>;
}