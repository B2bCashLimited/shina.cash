import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, catchError, tap } from 'rxjs/operators';
import { forkJoin, Subject, throwError } from 'rxjs';
import {keys} from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService, AuthService, ConfigService, LocationService, UserService } from '@b2b/services';
import { PhoneCode, Register } from '@b2b/models';
import { generate } from '@b2b/helpers/password-generator';
import { setToLocalStorage, transliterate } from '@b2b/helpers/utils';

@Component({
  selector: 'app-make-individual-signup',
  templateUrl: './make-individual-signup.component.html',
  styleUrls: ['./make-individual-signup.component.scss']
})
export class MakeIndividualSignupComponent implements OnInit {

  @Input() callback;
  @Input() individual;
  @Input() noCountryMode = false;     // для новой формы заказов
  @Input() noButtonMode = false;     // для новой формы заказов
  @Output() userRegistered = new EventEmitter();

  lang: string;
  phoneCodeInput$ = new Subject<any>();
  phoneCodes: PhoneCode[] = [];
  regForm: FormGroup;

  // Lodash 'keys' method
  keys = keys;

  private _originalPhoneCodes: PhoneCode[];

  constructor(
    public config: ConfigService,
    private _analyticService: AnalyticsService,
    private _formBuilder: FormBuilder,
    private _authService: AuthService,
    private _locationService: LocationService,
    private _translate: TranslateService,
    private _userService: UserService) {
  }

  ngOnInit() {
    this.regForm = this._formBuilder.group({
      lastName: [null, Validators.required],
      firstName: [null, Validators.required],
      phoneCode: [null, Validators.required],
      phone: [null, [Validators.required, Validators.minLength(10), Validators.pattern(/^[0-9]*$/)], this.phoneUnique],
      email: [null, [Validators.required, Validators.email], this.emailUnique],
      locationCtrl: [{value: null, disabled: this.noCountryMode}, [Validators.required]],
    });

    this.regForm.get('locationCtrl').valueChanges
      .subscribe((data) => {
        if (data) {
          if (+data.id === 405) {
            this.lang = 'ru';
          } else if (+data.id === 374) {
            this.lang = 'cn';
          } else {
            this.lang = 'en';
          }
        }
      });
    this.getCountriesPhoneCodes();
    this._bindToInputPhoneCode();
  }

  onPhoneCodeBlur() {
    if (!this.phoneCodes || !this.phoneCodes.length) {
      this.phoneCodes = this._originalPhoneCodes;
    }
  }

  onSubmit(customCountryId?: number) {
    const formValue = this.regForm.value;
    const data: Register = {
      client: 'front',
      email: formValue.email,
      firstName: transliterate(formValue.firstName),
      lastName: transliterate(formValue.lastName),
      middleName: formValue.middleName,
      password: generate(10),
      phoneCode: formValue.phoneCode,
      phone: formValue.phone,
      username: formValue.email,
      country: customCountryId || +this.regForm.getRawValue().locationCtrl.id,
      hash: null,
      individual: true
    };

    this._authService.signup(data)
      .pipe(
        catchError((err) => throwError(err)),
        tap((res: any) => {
          if (res && res.user) {
            setToLocalStorage('B2B_AUTH', res.user.auth);
            this.userRegistered.emit({user: res.user, isNewUserRegistered: true});
          }
        })
      )
      .subscribe(this.callback ? this.callback() : (() => {      // выполняет callback или редиректит на главную
      })); /*this.config.showSnackBar$.next({message: this._translate.instant('errorTryLater')})*/
  }

  private getCountriesPhoneCodes(): void {
    forkJoin(this._locationService.getCountriesPhoneCodes()
        .pipe(
          map(res => {
            this._originalPhoneCodes = res;
            this.phoneCodes = res;
          })),
      this._userService.getGeoDataByIp()
    ).subscribe((res: any[]) => {
      if (res[1].country && res[1].country.id) {
        const code = this.phoneCodes
          .find(value => (value._embedded && value._embedded.country && +value._embedded.country.id) === +res[1].country.id);

        if (code) {
          this.regForm.get('phoneCode').setValue(code.phoneCode);
        }
      }
    });
  }

  private _bindToInputPhoneCode(): void {
    this.phoneCodeInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe((str: string) => {
      str = str || '';
      this.phoneCodes = this._originalPhoneCodes
        .filter(item => {
          const isText = new RegExp(/^[А-я]/).test(str);
          const isNumber = new RegExp(/^\d/).test(str);

          if (isText) {
            return (item['name' + this.config.locale] as string).toLowerCase().includes(str.toLowerCase());
          } else if (isNumber) {
            return item.phoneCode.toString().toLowerCase().startsWith(str.toLowerCase());
          }

          return true;
        });
    });
  }

  emailUnique = (control: FormControl) => this.checkUserUnique(control, 'email');
  phoneUnique = (control: FormControl) => this.checkUserUnique(control, 'phone');

  private checkUserUnique(control: FormControl, name: string) {
    const value = control.value;
    return this._authService.checkUserUnique(name, value)
      .pipe(
        map((response: any) => response.result),
        map(result => result ? null : {unique: true})
      );
  }
}
