import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfigService, UserService } from '@b2b/services';
import { MatSelectChange } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Company } from '@b2b/models';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {

  domainOwner: any;
  domainOwnerCompany: Company;
  currentYear = new Date().getFullYear();

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _translateService: TranslateService,
    private _userService: UserService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (this._userService.domainData$.value) {
      this.domainOwnerCompany = this._userService.domainData$.value.company;
      this.domainOwner = this._userService.domainData$.value.company._embedded.user;
    } else {
      this._userService.domainData$
        .pipe(
          filter(res => !!res),
          takeUntil(this._unsubscribe$)
        )
        .subscribe(res => {
          this.domainOwnerCompany = res.company;
          this.domainOwner = res.company._embedded.user;
        });
    }
  }

  get lang(): string {
    return this.config.locale.toLowerCase();
  }

  onUiLanguageChangedMobile(evt: MatSelectChange) {
    this._translateService.use(evt.value);
  }
}
