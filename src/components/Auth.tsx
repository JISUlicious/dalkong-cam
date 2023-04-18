import {Link} from "react-router-dom";

export function Auth () {
    return <div>
        <h1>Auth</h1>
        <Link to={"/main"}>to Main</Link>
    </div>
}