import {Link} from "react-router-dom";

export function Main () {
    return <div>
        <h1>Main</h1>
        <Link to={"/room/create"}>to CreateRoom</Link>
    </div>
}