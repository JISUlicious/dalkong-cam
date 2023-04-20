import {Link, useNavigate} from "react-router-dom";
import {useState} from "react";
import React from "react";
import {signInEmail, signUpEmail} from "../functions/auth";

export function Auth () {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");
  const [signUp, setSignUp] = useState(false);

  function onChangeId (event: React.ChangeEvent<HTMLInputElement>) {
    setInputId(event.target.value);
  }

  function onChangePw (event: React.ChangeEvent<HTMLInputElement>)  {
    setInputPw(event.target.value);
  }

  function onSubmit (event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signUp) {
      signInEmail(inputId, inputPw)
        .then(() => navigate("/main"))
        .catch((error: React.ErrorInfo) => {
          console.log(error);
        });
    } else {
      signUpEmail(inputId, inputPw)
        .then(() => navigate("/main"))
        .catch((error: React.ErrorInfo) => {
          console.log(error);
        });
    }
  }

  const buttonText = signUp ? "Sign Up" : "Sign In";

  return <div>
    <h1>Auth</h1>
    <Link to={"/main"}>to Main</Link>

    <form onSubmit={onSubmit}>
      <label>
        <input onChange={onChangeId} placeholder="ID" required={true} />
      </label>
      <label>
        <input onChange={onChangePw} placeholder="PW" required={true} type="password" />
      </label>
      <button type="submit">{buttonText}</button>
    </form>
    <button
      className={"sign-up"}
      onClick={() => setSignUp(!signUp)}
    >
      {signUp ? "Already have an account" : "Sign up for new account"}
    </button>
  </div>;
}