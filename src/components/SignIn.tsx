import "../styles/App.scss";
import "../styles/Auth.scss";
import React from "react";
import {AuthForm} from "./AuthForm";
import {Link} from "react-router-dom";

export function SignIn () {
  return <div className="auth body-content">
    <h1>Sign with Your Account</h1>

    <AuthForm signUp={false}/>
    <Link to="/sign-up">
      <button className={"sign-up text-only-button"}>
        or click here to sign up for new account
      </button>
    </Link>
  </div>;
}