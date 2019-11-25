import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Company } from '@b2b/models';
import { ConfigService, UserService } from '@b2b/services';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-policy',
  templateUrl: './policy.component.html',
  styleUrls: ['./policy.component.scss']
})
export class PolicyComponent implements OnInit, OnDestroy {

  urlCheckLang: string;
  host = location.host;
  domainOwner: any;
  domainOwnerCompany: Company;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _route: ActivatedRoute,
    private _userService: UserService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.urlCheckLang = this._route.snapshot.params['lang'];

    if (!this._userService.domainData$.value) {
      this._userService.domainData$
        .pipe(
          filter(res => !!res),
          takeUntil(this._unsubscribe$)
        )
        .subscribe(res => {
          this.domainOwnerCompany = res.company;
          this.domainOwner = res.company._embedded.user;
        });
    } else {
      this.domainOwnerCompany = this._userService.domainData$.value.company;
      this.domainOwner = this._userService.domainData$.value.company._embedded.user;
    }
  }

}
