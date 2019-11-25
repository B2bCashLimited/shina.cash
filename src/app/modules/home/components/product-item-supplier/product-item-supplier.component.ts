import { Component, Input } from '@angular/core';
import { ConfigService, ProductService, UserService } from '@b2b/services';
import { PaymentOptions } from '@b2b/constants';
import { Category } from '@b2b/models';
import { Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-product-item-supplier',
  templateUrl: './product-item-supplier.component.html',
  styleUrls: ['./product-item-supplier.component.scss']
})
export class ProductItemSupplierComponent {

  get product(): any {
    return this._product;
  }

  @Input() set product(value: any) {
    if (this._product !== value) {
      this._product = value;

      if (this._product) {
        this.count.patchValue(this._product.minimalAmount || 1);
        this.count.setValidators(Validators.min(this._product.minimalAmount || 1));
        this.count.updateValueAndValidity();
      }
    }
  }

  @Input() category: Category;
  @Input() checkedProducts = [];

  paymentOptions = PaymentOptions;
  currentCart: Map<any, any> = this._productService.cartedProducts;
  count = new FormControl(null);
  price = new FormControl(null, Validators.min(1));

  private _product: any;

  constructor(
    public config: ConfigService,
    private _userService: UserService,
    private _productService: ProductService,
    private _router: Router,
    private _matSnackBar: MatSnackBar,
    private _translateService: TranslateService,
  ) {
  }

  makeOrder(): void {
    if (!this.count.value || this.count.invalid) {
      this._showSnackBar();
    } else {
      this._productService.clearCart();
      this._productService.isBuyNow.next(true);
      this._product.count = this.count.value;

      if (this.price.value) {
        this._product.price = this.price.value;
      }

      this._productService.cartedProducts.set(`${this.category.id}`, [this._product]);
      this._router.navigate(['make-individual-order']);
    }
  }

  productChecked(): void {
    if (!this.count.value || this.count.invalid) {
      this._showSnackBar();
    } else {
      const checkedProductsIds: number[] = this.checkedProducts ? this.checkedProducts.map(value => +value.id) : [];

      if (!checkedProductsIds.includes(+this._product.id)) {
        this.checkedProducts.push(this._product);
      } else {
        this.checkedProducts = this.checkedProducts.filter(value => +value.id !== +this._product.id);
      }
      this.currentCart.set(+this.category.id, this.checkedProducts);
    }
  }

  private _showSnackBar(): void {
    const message = `${this._translateService.instant('supplier.minimalOrder')} ${this._product.minimal_amount}
      ${this._product.priceFor['name' + this.config.locale]}`;
    this._matSnackBar.open(message, 'OK', {duration: 2000});
  }

}
