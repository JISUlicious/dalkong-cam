import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthForm } from "../components/AuthForm";

import { signInEmail } from "../../common/functions/auth";

export function SignIn () {
  const navigate = useNavigate();
  
  function onSubmit (event: React.FormEvent<HTMLFormElement>, id: string, pw: string) {
    event.preventDefault();
    signInEmail(id, pw)
      .then(() => navigate("/"))
      .catch((error: React.ErrorInfo) => {
        console.log(error);
      });
  }

  return <div className="auth body-content container-fluid pt-3">
    <div className="card">
      <div className="card-header fs-5">Sign-in with Your Account</div>
      <div className="card-body">
      <AuthForm buttonText="Sign In" onSubmit={onSubmit} />
      </div>
    </div>
    <Link to="/sign-up">
      <button type="button" className="btn btn-link mx-auto d-block">
        or click here to sign up for new account
      </button>
    </Link>
  </div>;
}