import {Link} from "react-router-dom";
import {useAuthContext} from "../contexts/AuthContext";

export function Main () {
  const { user } = useAuthContext();
  return <div>
    <h1>Main</h1>
    { user?.uid }
    <Link to={"/room/create"}>to CreateRoom</Link>
  </div>;
}