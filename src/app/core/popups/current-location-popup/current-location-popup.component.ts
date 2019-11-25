import { distinctUntilChanged, debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { of, Subject } from 'rxjs';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ConfigService, LocationService, UserService } from '@b2b/services';

@Component({
  selector: 'app-current-location-popup',
  templateUrl: './current-location-popup.component.html',
  styleUrls: ['./current-location-popup.component.scss']
})
export class CurrentLocationPopupComponent implements OnInit, OnDestroy {

  cities = [];
  initLocation;
  location: FormControl;
  cityName$ = new Subject<any>();
  showForm = false;

  private _citiesSub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    public matDialogRef: MatDialogRef<CurrentLocationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public config: ConfigService,
    private _locationService: LocationService,
    private _userService: UserService
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.location = new FormControl(null);
    let geoDataReq = of(this._userService.userGeoData$.value);
    if (!this._userService.userGeoData$.value) {
      geoDataReq = this._userService.getGeoDataByIp();
    }
    geoDataReq
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(geoData => {
        this.initLocation = (geoData && geoData.city && geoData.city.id) ? geoData.city : null;
        this.location.setValue(this.initLocation, {emitEvent: false});
        this.showForm = !this.location.value;
      });
    this.valueChangeCities();
  }

  valueChangeCities() {
    if (this._citiesSub && !this._citiesSub.closed) {
      this._citiesSub.unsubscribe();
    }

    this._citiesSub = this.cityName$
      .pipe(
        distinctUntilChanged(),
        debounceTime(300),
        switchMap(citySearch => {
          return this._locationService.getCity(citySearch);
        })
      ).subscribe(res => this.cities = res);
  }

  close(bool = false): void {
    if (bool) {
      this.matDialogRef.close(this.location.value);
    } else {
      this.matDialogRef.close();
    }
  }

  toggleLocation() {
    this.showForm = !this.showForm;
    this.location.setValue(this.initLocation);
  }
}
