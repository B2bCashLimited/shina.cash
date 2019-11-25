import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { ConfigService } from './config.service';
import { SignUp, User } from '@b2b/models';
import { UserService } from './user.service';
import { getFromLocalStorage, setToLocalStorage } from '@b2b/helpers/utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private _config: ConfigService,
    private _http: HttpClient,
    private _userService: UserService) {
  }

  /**
   * Request to change password
   */
  changePassword(password: string, key: string): Observable<any> {
    const body = { password, key };

    return this._http.post(`${this._config.apiUrl}/change-password-by-link`, body);
  }

  changePasswordWithoutLink(hash: string, password: string) {
    const body = { password, hash };
    return this._http.post(`${this._config.apiUrl}/employee-change-password`, body);
  }

  /**
   * Checks users whether logged in or not
   */
  get isLoggedIn(): boolean {
    return !!getFromLocalStorage('B2B_AUTH');
  }

  /**
   * Login with given credentials
   */
  login(email: string, password: string, doNotLogin = false): Observable<any> {
    const body: any = {
      username: email,
      password: password,
      grant_type: 'password',
      client_id: 'front'
    };

    return this._http.post(this._config.oauthUrl, body)
      .pipe(
        catchError(err => throwError(err)),
        tap(res => setToLocalStorage('B2B_AUTH', res)),
        switchMap(() => doNotLogin ? of(null) : this.getUser(email))    // doNotLogin - для простого получения токена, без входа
      );
  }

  checkUserUnique(field: string, value: string): Observable<any> {
    const query = { field, value };
    const params = new HttpParams({ fromObject: query });

    return this._http.get(`${this._config.apiUrl}/check-user-unique`, { params });
  }

  /**
   * Logout current user
   */
  logout(): Observable<any> {
    const body: any = {};
    localStorage.clear();
    sessionStorage.clear();

    return this._http.post(`${this._config.oauthUrl}/revoke`, body);
  }

  /**
   * Request email to restore password
   */
  restorePassword(email: string): Observable<any> {
    const body = { email };

    return this._http.post(`${this._config.apiUrl}/send-link-reset-password`, body)
      .pipe(
        catchError((err: any) => {
          localStorage.clear();
          sessionStorage.clear();
          return throwError(err.error);
        }),
      );
  }

  /**
   * Register user
   */
  signup(user: SignUp): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/user-register`, user);
  }

  userConfirm(token) {
    const query = { code: `${token}` };
    const params = new HttpParams({ fromObject: query });

    return this._http.get(`${this._config.apiUrl}/user-confirmation`, { params });
  }

  /**
   * Retrieve user by given email address
   */
  private getUser(email: string): Observable<User> {
    const query = {
      'filter[0][type]': 'eq',
      'filter[0][field]': 'email',
      'filter[0][value]': `${email}`,
      'filter[1][type]': 'eq',
      'filter[1][field]': 'isDeleted',
      'filter[1][value]': '0'
    };
    const params = new HttpParams({ fromObject: query });

    return this._http.get(`${this._config.apiUrl}/users`, { params })
      .pipe(
        catchError((err) => {
          localStorage.clear();
          sessionStorage.clear();
          return throwError(err);
        }),
        switchMap((res: any) => {
          const user = res._embedded.user[0];

          if (user && user.adminLevel) {
            return throwError(new Error('Доступ сотрудникам B2B.CASH запрещен!'));
          }

          return of(this._userService.currentUser = user);
        })
      );
  }
}
