import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConfigService, UserService } from '@b2b/services';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Company } from '@b2b/models';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit, OnDestroy {

  domainOwner: any;
  domainOwnerCompany: Company;

  zoom = 8;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public config: ConfigService,
    private _userService: UserService,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    if (!this._userService.domainData$.value) {
      this._userService.domainData$
        .pipe(
          filter(res => !!res),
          takeUntil(this._unsubscribe$)
        )
        .subscribe(res => {
          this.domainOwnerCompany = res.company;
          this.domainOwnerCompany.legalAddress.geoObject.lat = +this.domainOwnerCompany.legalAddress.geoObject.lat;
          this.domainOwnerCompany.legalAddress.geoObject.lng = +this.domainOwnerCompany.legalAddress.geoObject.lng;
          this.domainOwner = res.company._embedded.user;
        });
    } else {
      this.domainOwnerCompany = this._userService.domainData$.value.company;
      this.domainOwnerCompany.legalAddress.geoObject.lat = +this.domainOwnerCompany.legalAddress.geoObject.lat;
      this.domainOwnerCompany.legalAddress.geoObject.lng = +this.domainOwnerCompany.legalAddress.geoObject.lng;
      this.domainOwner = this._userService.domainData$.value.company._embedded.user;
    }
  }

}
