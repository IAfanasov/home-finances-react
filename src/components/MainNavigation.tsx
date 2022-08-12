import { NavLink } from "react-router-dom";
import { RoutePath } from "../route-path.enum";

function MainNavigation() {
    return <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                    <li className="nav-item">
                        <NavLink className="nav-link"
                                 to={RoutePath.csv}>CSV</NavLink>
                    </li>
                    <li>
                        <NavLink className="nav-link"
                                 to={RoutePath.root}>Add expense</NavLink>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
}

export default MainNavigation;