import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { YandexReachGoalDirective } from '@b2b/directives/yandex-reach-goal.directive';
import { TranslateModule } from '@ngx-translate/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { MaterialModule } from '@b2b/shared/material.module';
import { SignupPopupComponent } from '@b2b/shared/popups/signup-popup/signup-popup.component';
import { CountrySelectComponent } from '@b2b/shared/country-select/country-select.component';
import { SelectCategoryComponent } from '@b2b/shared/select-category/select-category.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { B2BRatingStarComponent } from '@b2b/shared/b2b-rating-star/b2b-rating-star.component';
import { NgxGalleryModule } from 'ngx-gallery';
import { AcquiringPayformComponent } from '@b2b/shared/acquiring-payform/acquiring-payform.component';
import { OrderSuccessDialogComponent } from '@b2b/shared/popups/order-success-dialog/order-success-dialog.component';
import { ConfirmPopupComponent } from '@b2b/shared/popups/confirm-popup/confirm-popup.component';
import { OrdersShippingDialogComponent } from '@b2b/shared/popups/orders-shipping-dialog/orders-shipping-dialog.component';
import { PricesListPopupComponent } from '@b2b/shared/popups/prices-list-popup/prices-list-popup.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { ProductFormCartPopupComponent } from '@b2b/shared/popups/product-form-cart-popup/product-form-cart-popup.component';
import { OWL_DATE_TIME_LOCALE, OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { AgmCoreModule } from '@agm/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    NgSelectModule,
    NgxPaginationModule,
    NgxGalleryModule,
    InfiniteScrollModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    AgmCoreModule,
  ],
  declarations: [
    YandexReachGoalDirective,
    SignupPopupComponent,
    CountrySelectComponent,
    SelectCategoryComponent,
    B2BRatingStarComponent,
    AcquiringPayformComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
  ],
  entryComponents: [
    SignupPopupComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    NgSelectModule,
    NgxPaginationModule,
    NgxGalleryModule,
    InfiniteScrollModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    AgmCoreModule,

    YandexReachGoalDirective,
    SignupPopupComponent,
    CountrySelectComponent,
    SelectCategoryComponent,
    B2BRatingStarComponent,
    AcquiringPayformComponent,
    OrderSuccessDialogComponent,
    ConfirmPopupComponent,
    OrdersShippingDialogComponent,
    PricesListPopupComponent,
    ProductFormCartPopupComponent,
  ],
  providers: [
    {provide: OWL_DATE_TIME_LOCALE, useValue: 'ru'},
  ]
})
export class SharedModule {
}
