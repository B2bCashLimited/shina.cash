import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { Category } from '@b2b/models';
import { MatDialog, PageEvent } from '@angular/material';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { takeUntil } from 'rxjs/operators';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { Brands } from '@b2b/constants';
import { ProductService, SeoService } from '@b2b/services';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  category: Category;
  products = [];
  pageEvent: PageEvent;
  pageEventIndexForFilters: number;
  isMobile = false;
  categoryChanged: any;
  brands = Brands;
  manufacturersList: string[] = [];
  selectedManufacturer: string;
  isMobileFilterOpen = false;
  isSortPriceAsc = true;
  sortedBy: {field: string, dir: boolean};
  currentCart: Map<any, any>;
  checkedProducts = [];
  seoH1 = '';
  seoTxt: SafeHtml = '';
  isLoading = false;

  bannerSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 1,
    grabCursor: true,
    uniqueNavElements: false,
    navigation: {
      nextEl: '.swiper-button-next.banner-next',
      prevEl: '.swiper-button-prev.banner-prev',
    },
    autoplay: {
      delay: 3000,
      disableOnInteraction: false
    }
  };

  brandsSwiperConfig: SwiperConfigInterface = {
    slidesPerView: 'auto',
    slideToClickedSlide: true,
    grabCursor: true,
    uniqueNavElements: false,
    navigation: {
      nextEl: '.swiper-button-next.brands-next',
      prevEl: '.swiper-button-prev.brands-prev',
    },
  };

  private _unsubscribe$: Subject<void> = new Subject<void>();

  constructor(
    private _router: Router,
    private _breakpointObserver: BreakpointObserver,
    private _productService: ProductService,
    private _seo: SeoService,
    private _matDialog: MatDialog,
    private _sanitizer: DomSanitizer,
  ) {
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  ngOnInit(): void {
    this.currentCart = this._productService.cartedProducts;

    this._breakpointObserver        // подписка на ширину - для скрытия списка категорий на мобилах
      .observe(['(max-width: 991px)'])
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((state: BreakpointState) => {
        this.isMobile = state.matches;

        if (!this.isMobile) {
          this.isMobileFilterOpen = false;
        }
      });

    this._seo.seoH1
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.seoH1 = res);

    this._seo.seoTxt
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(res => this.seoTxt = this._sanitizer.bypassSecurityTrustHtml(res));
  }

  openMobileFilter(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  onLoadedProducts(evt): void {
    this.products = evt;
  }

  onPageEventChanged(evt: PageEvent): void {
    this.pageEvent = evt;
  }

  pageChanged(evt: number): void {
    this.pageEvent.pageIndex = evt;
    this.pageEventIndexForFilters = evt;
  }

  onCategoryChanged(category: Category): void {
    this.manufacturersList = null;
    this.categoryChanged = category;
    this.category = category;
  }

  onCategoryOnInitChanged(category: Category): void {
    this.category = category;
  }

  onManufacturersLoaded(manufacturersList: string[]): void {
    this.manufacturersList = manufacturersList;
  }

  onSelectedManufacturer(brandName: string): void {
    this.selectedManufacturer = brandName;
  }

  sortByPrice(): void {
    this.isSortPriceAsc = !this.isSortPriceAsc;
    this.sortedBy = {
      field: 'price',
      dir: this.isSortPriceAsc
    };
  }

}
