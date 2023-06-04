import React, { Dispatch, FormEvent } from "react";

interface AuthFormProps {
  buttonText: string,
  setInputId: Dispatch<React.SetStateAction<string>>,
  setInputPw: Dispatch<React.SetStateAction<string>>,
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AuthForm ({buttonText, setInputId, setInputPw, onSubmit}: AuthFormProps) {

  function onChangeId (event: React.ChangeEvent<HTMLInputElement>) {
    setInputId(event.target.value);
  }

  function onChangePw (event: React.ChangeEvent<HTMLInputElement>)  {
    setInputPw(event.target.value);
  }

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