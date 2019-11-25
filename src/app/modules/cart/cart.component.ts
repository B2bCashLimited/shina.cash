import { Component, OnInit } from '@angular/core';
import { ConfigService, ProductService } from '@b2b/services';
import { CategorySimple } from '@b2b/models';
import { registerLocaleData } from '@angular/common';
import localeCn from '@angular/common/locales/ru';
import localeEn from '@angular/common/locales/ru';
import localeRu from '@angular/common/locales/ru';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {

  cartedProducts = [];
  cartedCategories: CategorySimple[] = [];
  currentCart: Map<any, any>;
  currentItem: any;
  showPricesList = false;

  constructor(
    public config: ConfigService,
    private _productService: ProductService,
    private _router: Router,
  ) {
    registerLocaleData(localeCn);
    registerLocaleData(localeEn);
    registerLocaleData(localeRu);
  }

  get totalPrice(): number {
    let sum = 0;
    this.cartedProducts.forEach(value => {
      if (value.paymentOption !== 3) {
        sum = sum + value.price * value.count * (value.countUnit || 1);
      }
    });
    return sum;
  }

  get cartedCurrency() {
    return this.cartedProducts && this.cartedProducts.length && this.cartedProducts[0].currency;
  }

  ngOnInit(): void {
    this.currentCart = this._productService.cartedProducts;
    console.log(this.currentCart);

    this.currentCart.forEach((value: any[], key: number) => {
      if (value && value.length) {
        this.cartedProducts.push(...value);
        if (!this.cartedCategories.find(value1 => +value1.id === key)) {
          this.cartedCategories.push(value[0].category);
        }
      }
    });

    if (this.cartedProducts) {
      this.cartedProducts.forEach(value => {
        // начальные установки кол-ва и paymentOption
        if (!value.count) {
          value.count = 1;
        }

        if (!value.paymentOption) {
          value.paymentOption = 1;
        }
      });
    }
  }

  toggleWings(evt: any, item): void {
    evt.stopPropagation();

    this.cartedProducts.forEach(value => value.showWings = false);

    if (item) {
      item.showWings = true;
    }
  }

  submit(): void {
    this._router.navigate(['make-individual-order']);
  }

  clearCart(): void {
    this.cartedProducts = [];
    this.cartedCategories = [];
    this.currentCart.clear();
  }

  getCartedProductsByCategory(categoryId: number): any[] {
    return this.cartedProducts.filter(value => (value.category && +value.category.id) === +categoryId);
  }

  deleteFormCart(product): void {
    this.cartedProducts = this.cartedProducts.filter(value => +value.id !== +product.id);
    this.currentCart.set(product.category && +product.category.id,
      this.getCartedProductsByCategory(product.category && +product.category.id));
  }

  onCountInputChange(evt: any, item) {
    if (Number(evt.target.value) <= 0) {
      this.deleteFormCart(item);
    }
  }

  onAllProposalsClick(item): void {
    this.currentItem = item;
    this.showPricesList = true;
  }

}
