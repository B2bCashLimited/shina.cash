import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CategoriesService, ConfigService, MyOrdersService, ProductService, UserService } from '@b2b/services';
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs';
import { delay, filter, first, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { MatDialog, PageEvent } from '@angular/material';
import { Category, MyOrders, Pager } from '@b2b/models';
import { OrderSuccessDialogComponent } from '@b2b/shared/popups/order-success-dialog/order-success-dialog.component';
import { ConfirmPopupComponent } from '@b2b/shared/popups/confirm-popup/confirm-popup.component';
import * as moment from 'moment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {

  @ViewChild('wrapCards') wrapCards: ElementRef;
  @ViewChild('wrapCardsAlternative') wrapCardsAlternative: ElementRef;

  myOrders: MyOrders[] = [];
  pageEvent: PageEvent = {
    pageSize: 5,
    pageIndex: 1,
    length: 25
  };
  serverUrl = this.config.serverUrl;
  isPending = false;
  userCompany: any;
  sortDateNew = true;
  isLoading = false;
  selectedStatus: string | number = -1;
  categories: Category[] = [];
  selectedCategory: Category;
  dateFrom: string;
  dateTo: string;

  readonly minDate = new Date(new Date().getFullYear() - 2, new Date().getMonth(), new Date().getDate());
  readonly maxDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  readonly statuses = [
    {
      label: 'profile.statuses.confirmed',
      value: 1
    },
    {
      label: 'profile.statuses.waiting',
      value: 3
    },
    {
      label: 'profile.statuses.paid',
      value: 'paid'
    },
  ];

  private unsubscribe$: Subject<void> = new Subject<void>();
  private _dateSub: Subscription;

  constructor(
    public config: ConfigService,
    private _myOrdersService: MyOrdersService,
    private _userService: UserService,
    private _productService: ProductService,
    private _categoriesService: CategoriesService,
    private _matDialog: MatDialog,
  ) {
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
    this._userService.userCompany$
      .pipe(
        filter(res => !!res),
        switchMap((userCompany: any) => {
          this.userCompany = userCompany;
          return this._getMyOrders();
        }),
        takeUntil(this.unsubscribe$)
      )
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    this._getCategories();
  }

  onStatusFilterChanged(evt): void {
    if (!!evt) {
      this._getMyOrders()
        .pipe(first())
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  onSelectedCategoryChanged(): void {
    this._getMyOrders()
      .pipe(first())
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  onDateChanged(evt: {input: any, source: any, value: any[]}) {
    if (evt.value && evt.value.length > 0) {
      this.dateFrom = moment(evt.value[0]).format('YYYY-MM-DD');
      this.dateTo = moment(evt.value[1]).format('YYYY-MM-DD');
      this._getMyOrders()
        .pipe(first())
        .subscribe(() => this.isLoading = false, () => this.isLoading = false);
    }
  }

  showCards(order: MyOrders): void {
    order['isCardOpened'] = !order['isCardOpened'];

    if (order['isCardOpened']) {
      order['isLoading'] = true;
      this._getFreeProducts(order);
    }
  }

  deleteOrder(order: MyOrders): void {
    this._matDialog.open(ConfirmPopupComponent)
      .afterClosed()
      .pipe(
        switchMap((res) => {
          if (res) {
            return this._productService.massDeleteProducts({ids: order.id})
              .pipe(
                switchMap(() => this._getMyOrders())
              );
          }

          return of(null);
        })
      ).subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  sortByDate(): void {
    if (this._dateSub && !this._dateSub.closed) {
      this._dateSub.unsubscribe();
    }

    this.sortDateNew = !this.sortDateNew;
    this._dateSub = this._getMyOrders()
      .subscribe(() => this.isLoading = false, () => this.isLoading = false);
  }

  private _getMyOrders(): Observable<any> {
    const data: any = {
      company: this.userCompany.id,
      order: this.sortDateNew ? 'dateDesc' : 'dateAsc',
      confirmed: this.selectedStatus === 3 || this.selectedStatus === 1 ? this.selectedStatus : null,
      paid: this.selectedStatus === 'paid' ? this.selectedStatus : null,
      category: this.selectedCategory,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    };

    this.isLoading = true;

    return this._myOrdersService.getMyOrders(data)
      .pipe(
        map((res: {pager: Pager, myOrders: MyOrders[]}) => {
          // console.log(orders);
          this.myOrders = res.myOrders;
          this.myOrders.forEach(value => {
            value['isCardOpened'] = false;
            value['isLoading'] = false;
            value.products = [];
            value['payformData'] = {
              freeOrderId: +value.id,
              acquiring: value.takenCompany && value.takenCompany.acquiring || null,
              currency: +value.currency.id,
              paid: value.paid
            };
            value.totalCount = +value.totalCount;
          });
          this.pageEvent = {
            length: res.pager.totalItems,
            pageIndex: res.pager.currentPage,
            pageSize: res.pager.perPage
          };
        })
      );
  }

  private _getFreeProducts(order: MyOrders): void {
    const params: any = {
      freeOrderId: order.id,
      page: 1,
      limit: 25
    };

    this._productService.getFreeOrderProposals(params)
      .pipe(
        tap(() => order.products = []),
        switchMap(({pager, proposals}) => {
          const products = (proposals || []).map(proposal => {
            return this._myOrdersService.retrieveFreeProduct({freeOrder: proposal.id});
          });
          return combineLatest(products);
        })
      )
      .subscribe((res: {pager: Pager, freeProduct: any[]}[]) => {
        const products = [];
        order['isLoading'] = false;
        res.forEach(value => {
          value.freeProduct.forEach(freeProd => {
            if (!freeProd.alternativeForProduct) {
              products.push(freeProd);
            }
          });
        });

        order.products.push(...products);
      }, () => order['isLoading'] = false);
  }

  private _getCategories() {
    this._categoriesService.getCategoryByName('Шины и Диски')
      .pipe(
        filter((res: any[]) => !!res && res.length > 0),
        map((res: any[]) => {
          return res.find(value => !(value.path as string).includes('.'));
        }),
        switchMap((res: any) => {
          if (res) {
            return this._categoriesService.getCategoryByIdAndNormalizeChildren(res.id)
              .pipe(
                tap((categories: Category[]) => this.categories = categories),
                delay(100)
              );
          }

          return of(null);
        })
      )
      .subscribe();
  }

}
