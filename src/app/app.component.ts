import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Component, OnInit, Injector, OnDestroy } from '@angular/core';
import { environment } from '@b2b/environments/environment';
import { ConfigService, SeoService, UserService } from '@b2b/services';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { getFromLocalStorage } from '@b2b/helpers/utils';
import { User } from '@b2b/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  hostName = environment.production ? location.hostname : 'shina.city';

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _injector: Injector,
    private _translateService: TranslateService,
    private _config: ConfigService,
    private _userService: UserService,
    private _seo: SeoService,
  ) {
    this.getLoggedUser();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this._translateService.setDefaultLang(environment.defaultLanguage);
    this._config.locale = this._translateService.getDefaultLang();
    this._subToSeoTagsUpdates();
    this._seo.setMainTitleAndDescription();

    this._translateService.onLangChange
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: LangChangeEvent) => this._config.locale = res.lang || environment.defaultLanguage);

    this._userService.getGeoDataByIp()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe();

    this._userService.getUserDataByDomain({domain: this.hostName})
      .subscribe(res => this._userService.domainData$.next(res));

    // POST /api/v1/sites { activityName: 1, activity: 56, domain: 'anvar.com' }
  }

  /**
   * Retrieve logged user to get user related options
   */
  private getLoggedUser(): void {
    if (getFromLocalStorage('B2B_AUTH')) {
      const userId = getFromLocalStorage('B2B_USER_ID');
      this._userService.getUserById(userId)
        .pipe(
          filter((user: User) => !!user),
          takeUntil(this._unsubscribe$)
        )
        .subscribe((user: User) => {
          const userCompanies = user._embedded.companies && (user._embedded.companies as any[]).length > 0;
          this._userService.currentUser = user;
          this._userService.userCompany$.next(userCompanies && user._embedded.companies[0] || null);
        });
    }
  }

  private _subToSeoTagsUpdates(): void {
    this._seo.title$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setTitle(value));

    this._seo.description$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setDescription(value));

    this._seo.keywords$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(value => this._seo.setKeywords(value));
  }
}
