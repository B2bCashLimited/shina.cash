import { Component, OnDestroy, OnInit, ViewChild, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatSnackBar } from '@angular/material';
import { ConfigService, LocationService, ProductService, UserService, AcquiringService, AuthService } from '@b2b/services';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import {
  MakeIndividualSignupComponent
} from '@b2b/modules/make-individual-order/components/individual-signup/make-individual-signup.component';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { City } from '@b2b/models';
import { PaymentOptions } from '@b2b/constants';
import { registerLocaleData, DOCUMENT } from '@angular/common';
import localeCn from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/ru';
import localeRu from '@angular/common/locales/ru';
import { OrdersShippingDialogComponent } from '@b2b/shared/popups/orders-shipping-dialog/orders-shipping-dialog.component';

@Component({
  selector: 'app-make-individual-order',
  templateUrl: './make-individual-order.component.html',
  styleUrls: ['./make-individual-order.component.scss']
})
export class MakeIndividualOrderComponent implements OnInit, OnDestroy {

  @ViewChild(MakeIndividualSignupComponent) signupComponent: MakeIndividualSignupComponent;

  cartedProducts = [];
  cities: City[] = [];
  currency: any = 'RUB';
  currentCart: any = [];
  deliveryAddress: FormGroup;
  deliveryAddressCityTypeahead$ = new Subject<any>();
  ordinaryChina = this._router.url.includes('fromChina');
  payment = new FormControl(1);
  isBuyNow = false;
  item: any = {};
  userCompany: any;
  acquiringId: number;
  disabled = false;
  regPending = false;

  private _delCitySub: Subscription;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  get isLoggedIn() {
    return this._authService.isLoggedIn;
  }

  get lang() {
    return this.config.locale.toLowerCase();
  }

  constructor(
    public config: ConfigService,
    private _acquiringService: AcquiringService,
    private _fb: FormBuilder,
    private _locationService: LocationService,
    private _authService: AuthService,
    private _productService: ProductService,
    private _router: Router,
    private _matDialog: MatDialog,
    private _userService: UserService,
    private _snackBar: MatSnackBar,
    @Inject(DOCUMENT) private _document: Document
  ) {
    registerLocaleData(localeCn);
    registerLocaleData(localeEn);
    registerLocaleData(localeRu);
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.currentCart = this.ordinaryChina ? this._productService.cartedProductsFromChina : this._productService.cartedProducts;

    this._userService.userCompany$
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.userCompany = res);

    this._userService.domainData$.pipe(
      takeUntil(this._unsubscribe$),
      switchMap((res: any) => this._acquiringService.getAcquiringList({ company: res && res.company && +res.company.id }))
    ).subscribe((res: any) => this.acquiringId = res && res.id);

    this._userService.getGeoDataByIp()
      .pipe(first())
      .subscribe(res => {
        if (res && res.city && res.city.id) {
          this.deliveryAddress.get('city').setValue(res.city);
          const item = res.city;
          item.region = res.region.id ? res.region : {};
          item.region.country = res.country;
          this.cities = [res.city];
        }
      });

    this._productService.isBuyNow
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((bool) => this.isBuyNow = bool);

    this.currentCart.forEach(value => {
      this.cartedProducts.push(...value);
    });
    this.currency = this.cartedProducts[0].currency;

    this.deliveryAddress = this._fb.group({
      city: [{ value: null, disabled: false }, Validators.required],
      street: [{ value: '', disabled: true }]
    });

    this.deliveryAddress.get('city').valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((res: any) => {
        if (res && Object.keys(res).length > 0) {
          this.deliveryAddress.get('street').enable();
        } else {
          this.deliveryAddress.get('street').disable();
        }
      });

    this._delCitySub = this.deliveryAddressCityTypeahead$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.cities = []),
        filter((str: string) => !!str && str.length > 0),
        switchMap((str: string) => this._locationService.getCities(str, 0))
      )
      .subscribe((value: City[]) => this.cities = value);
  }

  subAdd(product: any, bool: boolean) {
    if (bool) {
      ++product.count;
    } else if (product.count > 1) {
      --product.count;
    }
  }

  get totalPrice(): number {
    return this.cartedProducts.reduce((acc, curVal) => {
      if (curVal.paymentOption !== PaymentOptions.WAITING_FOR_OFFERS) {
        return acc + (curVal.price * curVal.count * (curVal.countUnit || 1));
      }
    }, 0);
  }

  deleteProduct(product) {
    this.cartedProducts = this.cartedProducts.filter((item) => item.id !== product.id);
  }

  makeOrder() {
    this.touchEverything();
    if (this.deliveryAddress.invalid) {
      return null;
    }
    if (this.signupComponent) {
      if (this.signupComponent.regForm.invalid || this.regPending) {
        return null;
      }
      this.regPending = true;
      const countryIdForSignup = +this.deliveryAddress.value.city.region.country.id;
      this.signupComponent.onSubmit(countryIdForSignup);
    } else {
      this.submit();
    }
  }

  markFormGroupAsTouched(fg: FormGroup) {
    (<any>Object).values(fg.controls).forEach(control => {
      control.markAsTouched();
      if (control.controls) {
        this.markFormGroupAsTouched(control);
      }
    });
  }

  registrationComplete(evt: any): void {
    if (evt && evt.user) {
      const individCompany = +evt.user.individual;
      this.regPending = false;
      this.submit(evt.isNewUserRegistered, individCompany);
    }
  }

  submit(isNewUserRegistered = false, indivCompanyId?) {
    this.disabled = true;
    if (indivCompanyId) {
      const products = {};
      this.cartedProducts.forEach(prod => {
        const prodId = +prod.id;
        products[prodId] = {
          count: prod.count,
          price: prod.price || 0,
          paymentOption: prod.paymentOption
        };
      });
      const body = {
        company: indivCompanyId || this.userCompany && this.userCompany.id || null,
        products,
        deliveryAddress: null,
        pickupCity: !this.deliveryAddress.get('street').value ? +this.deliveryAddress.get('city').value.id : null,
        paymentTypeOptions: {
          cashlessPaymentsOnCard: this.payment.value === 1,
          cashPayments: this.payment.value === 2
        }
      };

      this.submitUserCart(body, !!this.deliveryAddress.get('street').value, isNewUserRegistered)
        .pipe(
          switchMap((res) => {
            if (this.acquiringId && res && this.payment.value === 1) {
              return this._acquiringService.initPurchase({
                userCartIds: (res.id as number[]).join(),
                acquiringId: this.acquiringId
              });
            }
            return of(null);
          }),
          switchMap((res) => {
            if (isNewUserRegistered) {     // чистим токены, если это было незареганое физ лицо
              localStorage.clear();
              sessionStorage.clear();
            }

            if (res && res.success) {
              return of(res);
            } else {
              return this._matDialog.open(OrdersShippingDialogComponent, {
                width: '400px',
                height: 'auto',
                disableClose: true
              }).afterClosed();
            }
          }),
          takeUntil(this._unsubscribe$)
        ).subscribe((res) => {
          this.disabled = false;
          if (res) {
            this._document.location.href = res.paymentUrl;
          } else {
            this._router.navigate(['/']);
          }
        });
    }
  }

  submitUserCart(body, getLocation = false, isNewUserRegistered = false) {
    if (getLocation) {
      const obj: any = {
        locality: this.deliveryAddress.value.city.id,
        address: this.deliveryAddress.value.street,
        lat: null,
        lng: null
      };

      return this._locationService.setCordinat(obj)
        .pipe(
          switchMap((res) => {
            body['deliveryAddress'] = res['id'];
            return this._productService.createUserCart(body)
              .pipe(
                map((value: any) => {
                  if (!value.code) {
                    this._productService.clearCart();
                    return value;
                  } else {
                    this._snackBar.open(value.message, 'Ok', { duration: 3000 });
                    return false;
                  }
                }));
          }));
    }

    return this._productService.createUserCart(body)
      .pipe(
        map((value: any) => {
          if (!value.code) {
            this._productService.clearCart();
            return value;
          } else {
            this._snackBar.open(value.message, 'Ok', { duration: 3000 });
            return false;
          }
        }));
  }

  touchEverything() {
    this.deliveryAddress.get('city').markAsTouched();
    this.deliveryAddress.get('street').markAsTouched();
    if (this.signupComponent) {
      this.markFormGroupAsTouched(this.signupComponent.regForm);
    }
  }
}
