import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { AuthService, ConfigService, LocationService, ProductService, UserService } from '@b2b/services';
import { NavigationStart, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { City, User } from '@b2b/models';
import { DOCUMENT } from '@angular/common';
import { MatDialog } from '@angular/material';
import { CurrentLocationPopupComponent } from '../../core/popups/current-location-popup/current-location-popup.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  isLogged = false;
  user: User;
  selectedCity: City;
  searchKeyName: string;
  currentCart: Map<any, any>;
  domainOwner: any;

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    @Inject(DOCUMENT) private _document: Document,
    public config: ConfigService,
    private _router: Router,
    private _authService: AuthService,
    private _userService: UserService,
    private _productService: ProductService,
    private _renderer: Renderer2,
    private _matDialog: MatDialog,
    private _locationService: LocationService,
  ) {
    this.onNavigationStart();
  }

  get cartedProductsLength(): number {
    const cartedProducts = [];
    this.currentCart.forEach(value => cartedProducts.push(...value));
    return cartedProducts.length;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    const userGeoDataValue = this._userService.userGeoData$.value;

    if (!userGeoDataValue) {
      this._userService.getGeoDataByIp()
        .pipe(takeUntil(this._unsubscribe$))
        .subscribe((res: any) => {
          if (res.city && Object.keys(res.city).length) {
            this.selectedCity = res.city;
            this._locationService.selectedCity$.next(res.city);
          }
        });
    } else {
      if (userGeoDataValue.city && Object.keys(userGeoDataValue.city).length) {
        this.selectedCity = userGeoDataValue.city;
        this._locationService.selectedCity$.next(userGeoDataValue.city);
      }
    }

    if (this._userService.domainData$.value) {
      this.domainOwner = this._userService.domainData$.value.company._embedded.user;
    } else {
      this._userService.domainData$
        .pipe(
          filter(res => !!res),
          takeUntil(this._unsubscribe$)
        )
        .subscribe(res => this.domainOwner = res.company._embedded.user);
    }

    this.currentCart = this._productService.cartedProducts;
    this._userService.currentUser$
      .pipe(
        filter((user: User) => !!user),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((user: User) => this.user = user);
  }

  onProfileClick(): void {
    this._router.navigate(['profile']);
  }

  onLogoutClick() {
    localStorage.clear();
    this._productService.clearCart();      // чистим корзину
    this._router.navigate([''])
      .catch((err) => console.log(err));
    location.reload(true);
  }

  showHideMenu(show = false): void {
    if (show) {
      this._renderer.addClass(this._document.getElementsByTagName('html')[0], 'show-menu');
    } else {
      this._renderer.removeClass(this._document.getElementsByTagName('html')[0], 'show-menu');
    }
  }

  openRegionSelectPopup(): void {
    this._matDialog.open(CurrentLocationPopupComponent)
      .afterClosed()
      .pipe(filter(res => !!res))
      .subscribe(res => {
        this.selectedCity = res;
        this._locationService.selectedCity$.next(res);
      });
  }

  search(): void {
    this._locationService.searchKeyName$.next(this.searchKeyName);
  }

  openCart(): void {
    this._router.navigate(['cart']);
  }

  private onNavigationStart(): void {
    this._router.events
      .pipe(
        filter((evt) => evt instanceof NavigationStart),
        takeUntil(this._unsubscribe$)
      )
      .subscribe(() => this.isLogged = this._authService.isLoggedIn);
  }
}
