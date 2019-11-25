import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductDetailComponent } from './product-detail.component';
import { SharedModule } from '@b2b/shared/shared.module';
import { ProductDetailRouting } from '@b2b/modules/product-detail/product-detail-routing';
import {
  SuppliersPricesDialogComponent
} from '@b2b/modules/product-detail/dialogs/suppliers-prices-dialog/suppliers-prices-dialog.component';

@NgModule({
  declarations: [
    ProductDetailComponent,
    SuppliersPricesDialogComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    ProductDetailRouting,
  ], entryComponents: [SuppliersPricesDialogComponent]
})
export class ProductDetailModule {
}
