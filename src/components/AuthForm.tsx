import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {signInEmail, signUpEmail} from "../functions/auth";


interface AuthFormProps {
  signUp: boolean
}

export function AuthForm ({signUp = false}: AuthFormProps) {
  const navigate = useNavigate();
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

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
  return (<form onSubmit={onSubmit}>
    <label>
      <input onChange={onChangeId} placeholder="ID" required />
    </label>
    <label>
      <input onChange={onChangePw} placeholder="PW" required type="password" />
    </label>
    <button type="submit">{buttonText}</button>
  </form>);
}