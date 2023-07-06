import React from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthForm } from "./AuthForm";

import { signUpEmail } from "../../common/functions/auth";

export function SignUp () {
  const navigate = useNavigate();

  function onSubmit (event: React.FormEvent<HTMLFormElement>, id: string, pw: string) {
    event.preventDefault();
    signUpEmail(id, pw)
      .then(() => navigate("/"))
      .catch((error: React.ErrorInfo) => {
        console.log(error);
      });
  }
  return <div className="container-fluid pt-3">
  <div className="card">

      <h1 className="card-header">Create New Account</h1>

    <div className="card-body">
    <AuthForm buttonText="Sign Up" onSubmit={onSubmit} />
    
    </div>
  </div>
  

  <Link to="/sign-in">
    <button type="button" className="btn btn-link mx-auto d-block">
      or click here to sign in if you already have an account
    </button>
  </Link>
</div>;
}