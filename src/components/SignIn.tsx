import "../styles/App.scss";
import "../styles/Auth.scss";
import React from "react";
import {AuthForm} from "./AuthForm";
import {useNavigate} from "react-router-dom";

export function SignIn () {
  const navigate = useNavigate();
  return <div className="auth body-content">
    <h1>Sign with Your Account</h1>

    <AuthForm signUp={false}/>
    <button
      className={"sign-up text-only-button"}
      onClick={() => navigate("/sign-up")}
    >
      or click here to sign up for new account
    </button>
  </div>;
}