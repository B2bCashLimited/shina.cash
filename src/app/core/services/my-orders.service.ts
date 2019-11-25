import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MyOrders, Pager } from '@b2b/models';
import { removeEmptyProperties } from '@b2b/helpers/utils';

@Injectable({
  providedIn: 'root'
})
export class MyOrdersService {

  constructor(
    private _http: HttpClient,
    private _config: ConfigService
  ) {
  }

  getMyOrders(data: any): Observable<any> {
    const params = new HttpParams({fromObject: removeEmptyProperties(data)});

    return this._http.get(`${this._config.apiUrl}/get-my-orders`, {params})
      .pipe(
        map((res: any) => {
          const myOrders = res._embedded['get-my-orders'] as MyOrders[];
          return {pager: new Pager(res), myOrders};
        })
      );
  }

  retrieveFreeProduct(query): Observable<any> {
    const obj: any = {
      page: `${query.page}` || 1,
      limit: `${query.limit}` || 25,
      'order-by[0][type]': 'field',
      'order-by[0][field]': 'id',
      'order-by[0][direction]': 'desc',
    };

    if (query.freeOrder) {
      obj['filter[0][type]'] = 'eq';
      obj['filter[0][field]'] = 'freeOrder';
      obj['filter[0][value]'] = `${query.freeOrder}`;
    }

    const params = new HttpParams({fromObject: obj});

    return this._http.get(`${this._config.apiUrl}/free-product`, {params})
      .pipe(
        map((res: any) => {
          const freeProduct = res._embedded.free_product;

          return {pager: new Pager(res), freeProduct};
        }));
  }
}
