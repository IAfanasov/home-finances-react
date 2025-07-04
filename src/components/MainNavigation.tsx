import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { RoutePath } from '../route-path.enum';

export const MainNavigation = memo(() => (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                    <NavLink className="nav-link" to={RoutePath.csv}>
                        Import
                    </NavLink>
                </li>
                <li>
                    <NavLink className="nav-link" to={RoutePath.statement}>
                        Statement
                    </NavLink>
                </li>
                <li>
                    <NavLink className="nav-link" to={RoutePath.root}>
                        Manual
                    </NavLink>
                </li>
            </ul>
        </div>
    </nav>
));