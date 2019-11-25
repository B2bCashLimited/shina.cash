import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { getFromLocalStorage } from '@b2b/helpers/utils';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private _router: Router) {
  }

  /**
   * Deciding if a route can be activated.
   */
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (getFromLocalStorage('B2B_AUTH')) {
      return true;
    } else {
      localStorage.clear();
      const queryParams = {continue: state.url};
      this._router.navigate(['login'], {queryParams})
        .catch((err) => console.log(err));
      return false;
    }
  }
}
