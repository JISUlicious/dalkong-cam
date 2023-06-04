import React, { FormEvent, useState } from "react";

interface AuthFormProps {
  buttonText: string,
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string, pw: string) => void
}

export function AuthForm ({buttonText, onSubmit}: AuthFormProps) {
  const [inputId, setInputId] = useState("");
  const [inputPw, setInputPw] = useState("");

  function onChangeId (event: React.ChangeEvent<HTMLInputElement>) {
    setInputId(event.target.value);
  }

  function onChangePw (event: React.ChangeEvent<HTMLInputElement>)  {
    setInputPw(event.target.value);
  }

  return (<form onSubmit={(event) => onSubmit(event, inputId, inputPw)}>
    <label>
      <input onChange={onChangeId} placeholder="ID" required />
    </label>
    <label>
      <input onChange={onChangePw} placeholder="PW" required type="password" />
    </label>
    <button type="submit">{buttonText}</button>
  </form>);
}