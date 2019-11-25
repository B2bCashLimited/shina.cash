import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ConfigService } from './config.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AcquiringService {

  constructor(private _http: HttpClient,
    private _config: ConfigService) {
  }

  saveTerminalData(body: {
    company: number,
    clientId: string,
    clientSecret: string,
    type: number    // AcquiringTypes
  }): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/acquiring`, body);
  }

  initPurchase(body: { userCartIds: string | any, acquiringId: number }): Observable<any> {
    return this._http.post(`${this._config.apiUrl}/init-purchase`, body);
  }

  getAcquiringList(query: { company?: number, site?: number }) {
    const obj = {
      companyId: `${query.company}`,
      siteId: `${query.site}`
    };

    const params = new HttpParams({ fromObject: obj });

    return this._http.get(`${this._config.apiUrl}/get-acquiring-list`, { params })
      .pipe(map((res) => res[0]));
  }
}
