import {Link} from "react-router-dom";

export function CreateRoom () {

  const roomId = "test";
  return <div>
    <h1>CreateRoom</h1>
    <Link to={`/room/${roomId}`}>to Room</Link>
  </div>;
}