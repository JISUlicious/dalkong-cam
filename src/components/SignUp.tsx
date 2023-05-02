import "../styles/App.scss";
import "../styles/Auth.scss";
import React from "react";
import {AuthForm} from "./AuthForm";
import {Link} from "react-router-dom";

export function SignUp () {
  return <div className="auth body-content">
    <h1>Create New Account</h1>
    <AuthForm signUp={true} />
    <Link to="/sign-in">
      <button className={"sign-up text-only-button"}>
        or click here to sign in if you already have an account
      </button>
    </Link>
  </div>;
}