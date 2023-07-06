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
    <div className="container-fluid">
      <div className="input-group mb-3">
        <input 
          type="text" 
          className="form-control" 
          placeholder="User e-mail" 
          aria-label="User e-mail" 
          aria-describedby="basic-addon1" 
          onChange={onChangeId}
          required
        />
      </div>

      <div className="input-group mb-3">
        <input type="password" 
          className="form-control" 
          placeholder="Password" 
          aria-label="Password" 
          aria-describedby="basic-addon2" 
          onChange={onChangePw} 
        />
        <button className="btn btn-outline-secondary" type="submit" id="button-addon2">{buttonText}</button>
      </div>
    </div>
  </form>);
}