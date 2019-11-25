import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, UserService } from '@b2b/services';
import { of, throwError } from 'rxjs';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnInit {

  errorMessage: string;
  isLoading = false;
  showPassword = false;

  email = new FormControl(null, [
    Validators.required,
    Validators.email
  ]);
  password = new FormControl(null, [
    Validators.required,
    Validators.minLength(6),
    Validators.maxLength(30)
  ]);

  private _continueUrl: string;

  constructor(
    private _translate: TranslateService,
    private _authService: AuthService,
    private _userService: UserService,
    private _route: ActivatedRoute,
    private _router: Router,
  ) {
  }

  ngOnInit(): void {
    this._continueUrl = this._route.snapshot.queryParams['continue'];
  }

  /**
   * Show/hide password toggle
   */
  showHidePassword(evt: any): void {
    evt.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  onLoginClick(): void {
    const email = this.email.value.toLowerCase();
    const password = this.password.value;

    this.isLoading = true;
    this._authService.login(email, password)
      .pipe(
        switchMap((user: any) => {
          if (!user.status) {
            return throwError(new Error(this._translate.instant('login.accountUnConfirmed')));
          }

          return of(user);
        })
      )
      .subscribe((res: any) => {
        if (res) {
          if (res.errMsg) {
            this.isLoading = false;
            this.showError(res.errMsg);
          } else if (Object.keys(res).length > 0) {
            const userCompanies = res._embedded.companies && (res._embedded.companies as any[]).length > 0;
            this._userService.userCompany$.next(userCompanies && res._embedded.companies[0] || null);
            this._router.navigate([this._continueUrl || 'profile']);
          }
        }
      }, (err: any) => {
        localStorage.clear();
        sessionStorage.clear();
        this.isLoading = false;
        if (err && err.status === 403) {
          this.showError(this._translate.instant('login.accountDeleted'));
        } else if (err && err.status === 401) {
          this.showError(this._translate.instant('login.invalidGrant'));
        } else if (err && err.message) {
          this.showError(err.message);
        } else {
          this.showError(err);
        }
      });
  }

  /**
   * Navigate to the restore password page
   */
  onRestorePasswordClick(): void {
    this._router.navigate(['restore']);
  }

  showError(error: string) {
    this.errorMessage = error;
    setTimeout(() => {
      this.errorMessage = null;
    }, 3000);
  }

}
